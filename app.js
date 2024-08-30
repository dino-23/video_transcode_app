document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        alert('File uploaded successfully');
        loadFeed(); // Reload the feed after upload
    } else {
        alert('Failed to upload file');
    }
});

async function loadFeed() {
    const response = await fetch('/feed');
    const feed = await response.json();

    const feedContainer = document.getElementById('feed');
    feedContainer.innerHTML = '';

    feed.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';

        if (item.filePath.endsWith('.mp4')) {
            const video = document.createElement('video');
            video.src = item.filePath;
            video.controls = true;
            mediaItem.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = item.filePath;
            mediaItem.appendChild(img);
        }

        const description = document.createElement('p');
        description.textContent = item.description;
        mediaItem.appendChild(description);

        feedContainer.appendChild(mediaItem);
    });
}

// Load the feed on page load
loadFeed();



