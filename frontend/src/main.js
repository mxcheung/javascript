import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, isUserAuthorised } from './helpers.js';

let start = 0; // Track the starting index for fetching threads
const threadsPerPage = 5; // Number of threads to fetch per page
let threadsArray = [];

const pages = ['login', 'register', 'dashboard', 'create', 'edit'];
const goToPage = (newPage) => {
    for (const page of pages) {
        document.getElementById(`page-${page}`).style.display = 'none';
    }
    document.getElementById(`page-${newPage}`).style.display = 'flex';
}

document.getElementById('nav-login').addEventListener('click', () => {
    goToPage('login');
    document.getElementById('nav-register').style.display = 'block';
    document.getElementById('nav-login').style.display = 'none';
});

document.getElementById('nav-register').addEventListener('click', () => {
    goToPage('register');
    document.getElementById('nav-register').style.display = 'none';
    document.getElementById('nav-login').style.display = 'flex';
});

document.getElementById('logout').addEventListener('click', () => { 
    localStorage.removeItem('token');
    goToPage('login');
    document.getElementById('logout').style.display = 'none';
    document.getElementById('nav-register').style.display = 'block';
});

document.getElementById('register-go').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const name = document.getElementById('register-name').value;
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    fetch('http://localhost:5005/' + 'auth/register', {
        method: 'POST',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify({
        email: email,
        password: password,
        name: name,
      })
    }).then((response) => {
        response.json().then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                const token = data.token;
                localStorage.setItem('token', token);
                goToPage('dashboard');
                document.getElementById('logout').style.display = 'flex';
                document.getElementById('nav-register').style.display = 'none';
            }
        });
    });
});

let threadsFetched = false;
document.getElementById('login-go').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    fetch('http://localhost:5005/' + 'auth/login', {
        method: 'POST',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify({
        email: email,
        password: password,
        })
    }).then((response) => {
        response.json().then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                const token = data.token;
                localStorage.setItem('token', token);
                goToPage('dashboard');
                if (!threadsFetched) {
                    fetchThreads(0);
                    threadsFetched = true;
                }
                document.getElementById('logout').style.display = 'flex';
                document.getElementById('nav-register').style.display = 'none';
            }
        });
    }); 
});

document.getElementById('create').addEventListener('click', () => {
    document.getElementById('logout').style.display = 'none';
    goToPage('create');
});

document.getElementById('submit-thread').addEventListener('click', () => {

    const title = document.getElementById('create-title').value;
    const text = document.getElementById('create-text').value;
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return;
    }
    fetch('http://localhost:5005/' + 'thread', {
        method: 'POST',
        headers: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token'), 
        },
        body: JSON.stringify({
        title: title,
        isPublic: true,
        content: text,
      })
    }).then((response) => {
        response.json().then((data) => {
            if (data.error) {
                alert(data.error);
            } else {
                threadsArray = [];
                fetchThreads(0);
                goToPage('dashboard');
                document.getElementById('logout').style.display = 'flex';
                document.getElementById('nav-register').style.display = 'none';
            }
        });
    });
});

function fetchThreads(start) {
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return;
    }
    const url = `http://localhost:5005/threads?start=${start}`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Response status:', response.status);
            throw new Error('Failed to fetch threads');
        }
        return response.json();
    }).then(data => {
        const threadsContainer = document.getElementById('threads-container');
        if (data.length === 0) {
            document.getElementById('load-more').style.display = 'none';
            return;
        } else if (data.length < 5) {
            document.getElementById('load-more').style.display = 'none';
        }
        data.forEach(threadId => {
            fetchThreadById(threadId).then(thread => {
                threadsArray.push(thread);
                renderThreads();
            });
        });
    }).catch(error => {
        console.error('Error fetching threads:', error);
    });
}

function fetchThreadById(threadId, container) {
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return Promise.reject('User not authenticated');
    }
    const url = `http://localhost:5005/thread?id=${threadId}`;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch thread');
        }
        return response.json();
    }).then(thread => {
        return fetchAuthorNameById(thread.creatorId).then(authorName => {
            threadsArray.push({
                id: thread.id,
                title: thread.title,
                content: thread.content,
                authorName: authorName,
                isPublic: thread.isPublic,
                lock: thread.lock,
                creatorId: thread.creatorId,
                createdAt: thread.createdAt,
                likes: thread.likes
            });
        });
    }).catch(error => {
        console.error('Error fetching thread:', error);
        return Promise.reject(error);
    });
}



document.getElementById('load-more').addEventListener('click', () => {
    start += threadsPerPage;
    fetchThreads(start)
});

function fetchAuthorNameById(authorId) {
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return Promise.reject('User not authenticated');;
    }
    const url = `http://localhost:5005/user?userId=${authorId}`;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch author');
        }
        return response.json();
    }).then(author => {
        return author.name;
    }).catch(error => {
        console.error('Error fetching author:', error);
        return Promise.reject(error);
    });
}

function addThreadEventListeners() {
    const threadElements = document.querySelectorAll('.thread-element');
    threadElements.forEach(threadElement => {
        threadElement.addEventListener('click', () => {
            threadElements.forEach(element => {
                element.classList.remove('selected-thread');
            });
            threadElement.classList.add('selected-thread');
            const threadId = threadElement.dataset.threadId;
            const creatorId = threadElement.dataset.creatorId;
            navigateToThreadDetails(threadId, creatorId);
        });
    });
}

let isNavigating = false;
function navigateToThreadDetails(threadId, creatorId) {
    if (!isNavigating) {
        isNavigating = true;
        const threadContainer = document.getElementById('thread-container');
        threadContainer.innerHTML = '';
        const deleteButton = document.getElementById('delete');
        const editButton = document.getElementById('edit');
        const likeButton = document.getElementById('like');
        likeButton.style.display = 'block';
        if(isUserAuthorised(creatorId)) {
            deleteButton.style.display = 'block';
            editButton.style.display = 'block';
        } else {
            deleteButton.style.display = 'none';
            editButton.style.display = 'none';
        }
        renderThreadFromId(threadId).finally(() => {
            isNavigating = false; // Reset the flag after navigation is complete
        });
    }
}

function renderThreads() {
    const threadsContainer = document.getElementById('threads-container');
    threadsContainer.innerHTML = '';
    threadsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    threadsArray.forEach(thread => {
        const threadElement = document.createElement('div');
        threadElement.classList.add('thread-element');
        const formattedDate = new Date(thread.createdAt).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        threadElement.innerHTML = `
            <h4>${thread.title}</h4>
            <p>${thread.authorName}</p>
            <p>${formattedDate}</p>
            <p>Likes: ${thread.likes}</p>
        `;
        threadElement.dataset.threadId = thread.id;
        threadElement.dataset.creatorId = thread.creatorId;

        threadsContainer.appendChild(threadElement);
        addThreadEventListeners();
    });
}

function renderThreadFromId(threadId) {
    return new Promise((resolve, reject) => {
        const threadContainer = document.getElementById('thread-container');
        threadContainer.innerHTML = '';
        const thread = threadsArray.find(thread => thread.id == threadId);

        const threadElement = document.createElement('div');
        threadElement.classList.add('thread-element');
        const formattedDate = new Date(thread.createdAt).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        threadElement.innerHTML = `
            <h4>${thread.title}</h4>
            <p>${thread.content}</p>
            <p>${thread.authorName}</p>
            <p>${formattedDate}</p>
            <p>Likes: ${thread.likes}</p>
        `;
        threadElement.dataset.threadId = thread.id;
        threadElement.dataset.creatorId = thread.creatorId;
        threadContainer.appendChild(threadElement);
        resolve();
    });
}

document.getElementById('edit').addEventListener('click', () => {
    goToPage('edit')
    const selectedThreadElement = document.querySelector('.selected-thread');
    const editTitle = document.getElementById('edit-title');
    const editText = document.getElementById('edit-text');
    if (selectedThreadElement) {
        const threadId = selectedThreadElement.dataset.threadId;
        const thread = threadsArray.find(thread => thread.id == threadId);
        editTitle.value = thread.title;
        editText.value = thread.content;
    } else {
        alert('No thread is selected');
    }
});

document.getElementById('save-thread').addEventListener('click', () => {
    const editTitle = document.getElementById('edit-title').value;
    const editText = document.getElementById('edit-text').value;
    const selectedThreadElement = document.querySelector('.selected-thread');
    if (selectedThreadElement) {
        const threadId = selectedThreadElement.dataset.threadId;
        const thread = threadsArray.find(thread => thread.id == threadId);
        const isPublic = thread.isPublic;
        const lock = thread.lock;
        updateThread(threadId, editTitle, isPublic, editText, lock);
    } else {
        alert('No thread is selected');
    }
});

function updateThread(threadId, title, isPublic, content, lock) {
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return;
    }
    const url = `http://localhost:5005/thread`;
    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'), 
        },
        body: JSON.stringify({
            id: threadId,
            title: title,
            isPublic: isPublic,
            content: content,
            lock: lock
        })
    }).then((response) => {
        if (response.ok) {
            const index = threadsArray.findIndex(thread => thread.id === threadId);
            if (index !== -1) {
                threadsArray[index].title = title;
                threadsArray[index].content = content;
            }
            const threadElement = document.querySelector(`.thread-element[data-thread-id="${threadId}"]`);
            if (threadElement) {
                threadElement.querySelector('h4').textContent = title;
                threadElement.querySelector('p:nth-of-type(2)').textContent = content;
            }
            goToPage('dashboard');
            document.getElementById('logout').style.display = 'flex';
            document.getElementById('nav-register').style.display = 'none';
            navigateToThreadDetails(threadId);
        } else {
            response.json().then((data) => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Failed to update thread.');
                }
            });
        }
    }).catch(error => {
        console.error('Error updating thread:', error);
    });
}


function deleteThread(threadId) {
    if (!localStorage.getItem('token')) {
        alert('User not authenticated');
        return;
    }
    const url = `http://localhost:5005/thread`;
    fetch(url, {
        method: '',
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'), 
        },
        body: JSON.stringify({
            id: threadId
        })
    }).then((response) => {
        if (response.ok) {
            const index = threadsArray.findIndex(thread => thread && thread.id === threadId);
            if (index !== -1) {
                threadsArray.splice(index, 1);
            }
            const threadElement = document.querySelector(`.thread-element[data-thread-id="${threadId}"]`);
            if (threadElement) {
                const threadsContainer = document.getElementById('threads-container');
                threadsContainer.removeChild(threadElement);
                const id = threadsArray[0].id;
                const creatorId = threadsArray[0].creatorId;
                navigateToThreadDetails(id, creatorId);
            }
            goToPage('dashboard');
            document.getElementById('logout').style.display = 'flex';
            document.getElementById('nav-register').style.display = 'none';
        } else {
            response.json().then((data) => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Failed to delete thread.');
                }
            });
        }
    }).catch(error => {
        console.error('Error updating thread:', error);
    });
}

document.getElementById('delete').addEventListener('click', () => {
    const selectedThreadElement = document.querySelector('.selected-thread');
    if (selectedThreadElement) {
        const threadId = selectedThreadElement.dataset.threadId;
        deleteThread(threadId);
    } else {
        alert('No thread is selected');
    }
});
