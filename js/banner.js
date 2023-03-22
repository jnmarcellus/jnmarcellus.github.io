const getTopStories = async () => {
    const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const storyIds = await response.json();
    return storyIds.slice(0, 10);
};

const getStory = async (storyId) => {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
    const story = await response.json();
    return story;
};

const displayBanner = async (stories) => {
    const bannerContainer = document.getElementById("banner-container");
    let currentStoryIndex = 0;

    const updateBanner = () => {
        const story = stories[currentStoryIndex];
        bannerContainer.innerHTML = `
            <h6><a href="${story.url}" target="_blank">${story.title}</a></h6>
        `;
        currentStoryIndex = (currentStoryIndex + 1) % stories.length;
    };

    setInterval(updateBanner, 6000); // Change the duration (in milliseconds) to control the rotation speed
    updateBanner();
};

const fetchAndDisplayStories = async () => {
    const topStoryIds = await getTopStories();
    const topStories = await Promise.all(topStoryIds.map(getStory));
    displayBanner(topStories);
};

fetchAndDisplayStories();

//            <p>By: ${story.by} | Score: ${story.score}</p>
