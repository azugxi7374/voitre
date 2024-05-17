
function audioControler() {
    let micRecorder = null;
    let micChunks = [];

    // TODO
    const playbackMicTest = document.getElementById('playback_mictest');

    // TODO ???
    async function destroy() { }

    // fix. chunks
    async function createRecorder() {
        const MIC_OPTIONS = {
            mimeType: 'audio/webm; codecs=opus'
        };
        if (micRecorder) {
            return micRecorder;
        } else {

            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // const micTestStream = new MediaStream();
            // micTestStream.addTrack(audioStream.getAudioTracks()[0]);

            micRecorder = new MediaRecorder(audioStream, MIC_OPTIONS);
            // micRecorder = new MediaRecorder(micTestStream, MIC_OPTIONS);
            micChunks = [];

            micRecorder.ondataavailable = function (evt) {
                console.log("type=" + evt.data.type + " size=" + evt.data.size);
                micChunks.push(evt.data);
            };

            micRecorder.onstop = function (evt) {
                // console.log(6)
                // micRecorder = null;
            }
            return micRecorder;
        }
    }

    // マイクテスト再生
    // これはどちらかというとview
    function playMicTest(data, elem) {
        // Blobの作成
        const micBlob = new Blob(data, { type: "audio/webm" });
        // 再生できるようにURLを生成
        const micBlobUrl = window.URL.createObjectURL(micBlob);
        if (micBlobUrl) {
            elem.src = micBlobUrl;
            // 再生終了時
            elem.onended = function () {
                elem.pause();
                // elem.src = "";
            };
            // 再生
            elem.play();
        }
    };

    return {
        createRecorder,
        playMicTest,
        _getMicRecorder: () => micRecorder,
        _getMicTestChunks: () => micChunks,
        _getPlaybackMicTest: () => playbackMicTest,
    }
}
