const GlobalOptions = {
    SamplingInterval: 50,
}

main();

async function main() {
    // init
    const { audioStream, audioCtx, analyser } =
        await init();

    const dataArray = new Float32Array(analyser.frequencyBinCount)
    const timesliceData = []

    function mainLoop() {
        timesliceData.push(sampling(analyser, dataArray));
        draw(timesliceData);
    }

    const si = setInterval(mainLoop, GlobalOptions.SamplingInterval
    )
}


async function init() {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(audioStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    return { audioStream, audioCtx, analyser }
}

function sampling(analyser, dataArray) {
    analyser.getFloatTimeDomainData(dataArray);
    const time = Date.now()

    const rms = calcRMS(dataArray)
    const dB = Math.round(rmsTodB(rms))
    return {
        time, rms, dB
    }
}

function draw(timesliceData) {
    console.log(timesliceData[timesliceData.length - 1]);
}




function calcRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
}
function rmsTodB(rms) {
    return 20 * Math.log10(rms);
}

