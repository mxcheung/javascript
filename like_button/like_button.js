// Function to handle the like/unlike button click event
async function handleLikeButtonClick(postId) {
    try {
        const likeButton = document.getElementById(`like-button-${postId}`);
        const isLiked = likeButton.dataset.isLiked === 'true';
        
        // Make an asynchronous call to your backend API to handle the like/unlike action
        const response = await fetch(`/api/posts/${postId}/${isLiked ? 'unlike' : 'like'}`, {
            method: 'POST',
            // You might need to include headers or body depending on your backend API requirements
            // headers: {
            //     'Content-Type': 'application/json',
            // },
            // body: JSON.stringify({ postId: postId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to ${isLiked ? 'unlike' : 'like'} the post`);
        }

        // If the request is successful, update the UI accordingly
        const responseData = await response.json();
        updateLikeUI(postId, !isLiked, responseData.likes);
    } catch (error) {
        console.error('Error liking/unliking post:', error);
    }
}

// Function to update the like UI
function updateLikeUI(postId, isLiked, likeCount) {
    const likeButton = document.getElementById(`like-button-${postId}`);
    const likeCountElement = document.getElementById(`like-count-${postId}`);

    if (likeButton && likeCountElement) {
        likeButton.dataset.isLiked = isLiked;
        likeButton.textContent = isLiked ? 'Unlike' : 'Like';
        likeCountElement.textContent = likeCount;
    }
}

// Example of attaching the event listener to like/unlike buttons
document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', () => {
        const postId = button.dataset.postId;
        handleLikeButtonClick(postId);
    });
});
