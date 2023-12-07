const audioElement = document.getElementById("audioElement");
const transitionAudioElement = document.getElementById("transitionAudioElement");
const newSongSection = document.getElementById("newSongSection");
newSongSection.hidden = true;

let playlist = [];
let currentSongTracker = 0;
let fadeInInterval, fadeOutInterval, transitoryFadeInterval;
let progressionBarInputting = false;

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

    if (playlist.length > 30)
        playlist.splice(0, playlist.length - 30);
}

function updateData() {
    const currentSong = playlist[currentSongTracker];

    // Update table
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    for (const song of playlist) {
        tableBody.prepend(newRow(song));
    }

    const children = Array.from(tableBody.children).reverse();
    children.forEach((x) => x.classList.remove("active"));
    children[currentSongTracker].classList.add("active");

    // Update song name
    const songNameText = document.getElementById("songNameText");
    songNameText.innerText = currentSong.songName;

    // Update play/pause button
    const playButton = document.getElementById("playButton");
    const pauseButton = document.getElementById("pauseButton");
    if (audioElement.paused || fadeOutInterval) {
        playButton.hidden = false;
        pauseButton.hidden = true;
    }
    else {
        playButton.hidden = true;
        pauseButton.hidden = false;
    }

    // Update timer
    updateTime();
    if (!audioElement.paused) 
        currentSong.songTime = audioElement.currentTime;
    
    if (currentSong.songTime > audioElement.duration - 10) {
        currentSong.songTime = 0;
        transitionSong(true);
    }
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

    timeOutput = timeOutput.replace(/NaN/g, "00");
    timeText.innerText = timeOutput;

    // Progression bar
    if (!progressionBarInputting) {
        progressionBar.max = audioElement.duration;
        progressionBar.value = audioElement.currentTime;
    }

    function addZeros(time) {
        if (time < 10) 
            return "0" + time;
        else
            return time;
    }
}

function toggleAudio() {
    if (!audioElement.paused) {
        setFadeInterval("out");
    } 
    else {
        audioElement.src = playlist[currentSongTracker].songSrc;
        audioElement.currentTime = playlist[currentSongTracker].songTime;
        setFadeInterval("in");
    }
}

function transitionSong(next) {
    if (next && currentSongTracker < playlist.length - 1)
        currentSongTracker++;
    else if (!next && currentSongTracker > 0)
        currentSongTracker--;
    else 
        return;


    if (audioElement.paused) {
        playlist[currentSongTracker].songTime = 0;
        audioElement.currentTime = 0;
        return;
    }
    
    createTransitoryAudio();

    audioElement.pause();
    setTimeout(() => {
        audioElement.src = playlist[currentSongTracker].songSrc;
        audioElement.currentTime = 5;
        setFadeInterval("in");
    }, 400);
}



function setFadeInterval(fade, audioSource = audioElement) {
    // Clear intervals (if any)
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
    }
    if (fadeOutInterval) {
        clearInterval(fadeOutInterval);
    }

    // Set new
    if (fade === "in") {
        audioSource.volume = 0;
        audioSource.play();
        fadeInInterval = setInterval(() => {
            try {
                audioSource.volume += 0.083;
            } catch (error) {
                audioSource.volume = 1;
                clearInterval(fadeInInterval);
                fadeInInterval = null;
            }
            document.getElementById("audioVolume").value = audioElement.volume;
        }, 200);
    }
    else if (fade === "out") {
        fadeOutInterval = setInterval(() => {
            try {
                audioSource.volume -= 0.083;
            } catch (error) {
                audioSource.volume = 0;
                audioSource.pause();
                clearInterval(fadeOutInterval);
                fadeOutInterval = null;
            }
            document.getElementById("audioVolume").value = audioElement.volume;
        }, 200);
    }
    else if (fade === "transitory") {
        if (transitoryFadeInterval) {
            clearInterval(transitoryFadeInterval);
        }

        transitoryFadeInterval = setInterval(() => {
            try {
                audioSource.volume -= 0.083;
            } catch (error) {
                audioSource.volume = 0;
                audioSource.pause();
                clearInterval(transitoryFadeInterval);
            }
        }, 150);

        setTimeout(() => {
            audioSource.pause();
        }, 1950);
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
    const newTime = e.target.value;
    if (audioElement.paused) {
        audioElement.currentTime = newTime;
        return;
    }

    createTransitoryAudio();

    audioElement.pause();
    setTimeout(() => {
            audioElement.currentTime = newTime;
            setFadeInterval("in");
    }, 1100);
}

function createTransitoryAudio() {
    const transitoryAudio = new Audio(audioElement.src);
    transitoryAudio.currentTime = audioElement.currentTime + 0.1;
    transitoryAudio.play();
    setFadeInterval("transitory", transitoryAudio);
}

function newRow(song) {
    const rowTemplate = document.getElementById("templateRow");
    const newRow = rowTemplate.content.cloneNode(true);
    
    newRow.querySelector(".sender").innerText = song.sender;
    newRow.querySelector(".message").innerText = song.message;
    newRow.querySelector(".song-name").innerText = song.songName;

    return newRow;
}

function handleFormSubmit(e) {
    e.preventDefault();
    e.target.reset();
    toggleNewSongSection();
}

function handleFormReset() {
    document.getElementById("audioFileInputCounter").innerText = "";
}



window.onbeforeunload = () => savePlaylist();
window.onload = () => loadPlaylist();
window.onkeydown = (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        toggleAudio();
    }
}
document.getElementById("audioFileInput").addEventListener("change", (e) => document.getElementById("audioFileInputCounter").innerText = `Files selected: ${e.target.files.length}`);
document.getElementById("audioLength").onmousedown = () => progressionBarInputting = true;
document.getElementById("audioLength").onmouseup = () => progressionBarInputting = false;
setInterval(() => {
    updateData();
}, 250);



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