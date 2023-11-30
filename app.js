const audioElement = document.getElementById("audioElement");
const transitionAudioElement = document.getElementById("transitionAudioElement");
const newSongSection = document.getElementById("newSongSection");
newSongSection.hidden = true;

// { sender: "Anonymous", message: "No message sent", song: { name: "No song playing" } }
let playlist = [];
let currentSongTracker = 0;
let fadeInInterval, fadeOutInterval;

function toggleNewSongSection() {
    if (!newSongSection.hidden) {
        newSongSection.hidden = true;
    }
    else if (newSongSection.hidden) {
        newSongSection.hidden = false;
    }
}

function addNewSong() {
    const form = document.getElementById("newSongForm");
    const formData = new FormData(form);
    const audioFileInput = document.getElementById("audioFileInput");
    
    for (const file of audioFileInput.files) {
        const sender = formData.get("sender") ? formData.get("sender") : "Anonymous";
        const message = formData.get("message") ? formData.get("message") : "No message";
        const songSrc = "D:\DJFolder/" + file.name;

        const newSongObject = { sender: sender, message: message, songSrc: songSrc, songName: file.name, songTime: 0};
        playlist.push(newSongObject);
    }
    
    form.onsubmit = (e) => {
        e.preventDefault();
        form.reset();
        toggleNewSongSection();
    };
    
    updateData();
}

function updateData() {
    const songNameText = document.getElementById("songNameText");
    const senderText = document.getElementById("senderText");
    const messageText = document.getElementById("messageText");
    const currentSong = playlist[currentSongTracker];

    senderText.innerText = currentSong.sender;
    messageText.innerText = currentSong.message;
    songNameText.innerText = currentSong.songName;

    // Add song list entry

    let timeCheckInterval = setInterval(() => {
        updateTime();
        currentSong.songTime = audioElement.currentTime;
    }, 1000);
}

function updateTime() {
    const timeText = document.getElementById("timeText");
    const progressionBar = document.getElementById("audioLength");
    let timeOutput = "";

    // Current
    let songMinutes = addZeros(Math.floor(audioElement.currentTime / 60));
    let songSeconds = addZeros(Math.floor(audioElement.currentTime - songMinutes * 60));
    timeOutput += `${songMinutes}:${songSeconds} / `;
    // Duration
    songMinutes = addZeros(Math.floor(audioElement.duration / 60));
    songSeconds = addZeros(Math.floor(audioElement.duration - songMinutes * 60));
    timeOutput += `${songMinutes}:${songSeconds}`;

    timeText.innerText = timeOutput;

    // Progression bar
    progressionBar.max = audioElement.duration;
    progressionBar.value = audioElement.currentTime;

    function addZeros(time) {
        if (time < 10) 
            return "0" + time;
        else
            return time;
    }
}

function toggleAudio() {
    togglePlayButton();
    if(audioElement.currentTime === 0) {
        audioElement.src = playlist[currentSongTracker].songSrc;
    }

    if (!audioElement.paused) {
        setFadeInterval("out");
    } 
    else {
        audioElement.currentTime = playlist[currentSongTracker].songTime;
        audioElement.volume = 0;
        setFadeInterval("in");
        updateData();
    }

    function togglePlayButton() {
        const playButton = document.getElementById("playButton");
        if (playButton.classList.contains("bi-play-fill")) {
            playButton.classList.remove("bi-play-fill");
            playButton.classList.add("bi-pause-fill");
        }
        else {
            playButton.classList.remove("bi-pause-fill");
            playButton.classList.add("bi-play-fill");
        }
    }
}

function transitionSong(next) {
    if (audioElement.paused) 
        return;

    setFadeInterval("out");
    if (next)
        currentSongTracker++;
    else 
        currentSongTracker--;

    setTimeout(() => {
        audioElement.src = playlist[currentSongTracker].songSrc;
        setFadeInterval("in");
        updateData();
    }, 2600);
}

function setFadeInterval(fade) {
    // Clear previous (if any)
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
    }
    if (fadeOutInterval) {
        clearInterval(fadeOutInterval);
    }

    // Set new
    if (fade === "in") {
        audioElement.play();
        fadeInInterval = setInterval(() => {
            try {
                audioElement.volume += 0.083;
            } catch (error) {
                audioElement.volume = 1;
                clearInterval(fadeInInterval);
            }
            document.getElementById("audioVolume").value = audioElement.volume;
        }, 200);
    }
    else if (fade === "out") {
        fadeOutInterval = setInterval(() => {
            try {
                audioElement.volume -= 0.083;
            } catch (error) {
                audioElement.volume = 0;
                audioElement.pause();
                clearInterval(fadeOutInterval);
            }
            document.getElementById("audioVolume").value = audioElement.volume;
        }, 200);
    }
}

function fadeVolume(e) {
    const volume = e.target.value;
    const volumeStep = (audioElement.volume - volume) /  4;

    let volumeFadeInterval = setInterval(() => {
        try {
            audioElement.volume -= volumeStep;

            if (volumeStep > 0) {
                if (audioElement.volume <= volume) {
                    end();
                }
            }
            else {
                if (audioElement.volume >= volume) {
                    end();
                }
            }
        } catch (error) {
            end();
        }
    }, 250);
    
    function end() {
        audioElement.volume = volume;
        clearInterval(volumeFadeInterval);
    }
}

function fadeTimeSkip(e) {
    if (audioElement.paused)
        return;

    const transitoryAudio = new Audio(audioElement.src);
    transitoryAudio.currentTime = audioElement.currentTime + 0.1;
    transitoryAudio.play();

    let transitoryFadeInterval = setInterval(() => {
        try {
            transitoryAudio.volume -= 0.083;
        } catch (error) {
            transitoryAudio.volume = 0;
            transitoryAudio.pause();
            clearInterval(transitoryFadeInterval);
        }
    }, 150);

    const newTime = e.target.value;
    audioElement.pause();
    audioElement.volume = 0;
    setTimeout(() => {
            audioElement.currentTime = newTime;
            setFadeInterval("in");
    }, 1100);
}

window.onbeforeunload = () => savePlaylist();
window.onload = () => loadPlaylist();




function savePlaylist() {
    const jsonObject = JSON.stringify(playlist);
    localStorage.setItem("playlist", jsonObject);
    localStorage.setItem("currentSongTracker", currentSongTracker);
}

function loadPlaylist() {
    const playlistObject = JSON.parse(localStorage.getItem("playlist"));
    const currentSongTrackerObject = JSON.parse(localStorage.getItem("currentSongTracker"));

    if (!playlistObject)
        playlist = [];
    else 
        playlist = playlistObject;

    if (!currentSongTrackerObject)
        currentSongTracker = 0;
    else
        currentSongTracker = localStorage.getItem("currentSongTracker");
}

function clear() {
    playlist = [];
    currentSongTracker = 0;
}