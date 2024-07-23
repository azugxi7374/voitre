import { createApp, } from 'vue'
import { draw } from './draw.js'

const GlobalOptions = {
    SAMPLING_INTERVAL: 200,
    MAX_TILESLICE_LEN: 100,
    ELEM_CLASS: "content",
    SAMPLE_RATE: 8000,
    FFT_SIZE: 4096,
}

// main();
window._g = { main }
async function main() {
    // init
    const { audioStream, audioCtx, analyser } = await init();


    const dataArray = new Float32Array(analyser.frequencyBinCount)
    const timesliceData = []

    function mainLoop() {
        timesliceData.push(sampling(analyser, dataArray, audioCtx));
        while (timesliceData.length > GlobalOptions.MAX_TILESLICE_LEN) {
            timesliceData.shift();
        }
        draw(timesliceData, document.querySelector("." + GlobalOptions.ELEM_CLASS));
    }

    const si = setInterval(mainLoop, GlobalOptions.SAMPLING_INTERVAL
    )
}


async function init() {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // const audioCtx = new AudioContext();
    const audioCtx = new AudioContext({ sampleRate: GlobalOptions.SAMPLE_RATE });
    const source = audioCtx.createMediaStreamSource(audioStream);
    const analyser = audioCtx.createAnalyser();
    // analyser.fftSize = 2048;
    analyser.fftSize = GlobalOptions.FFT_SIZE// 256;
    source.connect(analyser);

    return { audioStream, audioCtx, analyser }
}

function sampling(analyser, dataArray, audioCtx) {
    // analyser.getFloatTimeDomainData(dataArray);
    analyser.getFloatFrequencyData(dataArray);
    const time = Date.now()

    // const rms = calcRMS(dataArray)
    // const dB = Math.round(rmsTodB(rms))
    const dB = sumOfDecibel(...dataArray)
    const maxIndex = calcMaxIndex(dataArray, (a, b) => a > b).maxI
    const freq = fftIndexToFreq(audioCtx.sampleRate, dataArray.length, maxIndex)
    const scale = hzToNormScale(freq)
    return {
        time, dB, freq, scale,
    }
}

function calcMaxIndex(arr, leftIsMax) {
    let maxI = 0
    let maxV = arr[0]
    arr.forEach((_, i) => {
        if (leftIsMax(arr[i], maxV)) {
            maxI = i;
            maxV = arr[i];
        }
    })
    return { maxI, maxV }
}


function fftIndexToFreq(sampleRate, dataLength, i) {
    // console.log(sampleRate, dataLength, i)
    return (i + 1) * sampleRate / 2 / dataLength
}
// ↓ db合成
function sumOfDecibel(...arr) {
    return 10 * Math.log10(arr.reduce((sum, v) => sum + Math.pow(10, v / 10), 0))
}

// 音階計算。Aからの相対音階
function hzToNormScale(hz) {
    const l = Math.log2(hz / 440);
    const normL = l - Math.floor(l);
    return normL * 12
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

function calcDBStat(dbTimeSlice) {
    const avg = dbTimeSlice.reduce((sum, x) => sum + x, 0) / dbTimeSlice.length
    let v = 0;
    if (dbTimeSlice.length > 0) {
        v = dbTimeSlice.reduce((sum2, x) => sum2 + (x - avg) * (x - avg)) / (dbTimeSlice.length - 1)
    }
    return [avg, v]
}

