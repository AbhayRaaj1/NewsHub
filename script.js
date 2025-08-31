// ---------------------- Date & Time ----------------------
function updateDateTime() {
    const now = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const dateTimeElement = document.getElementById("dateTime");
    if(dateTimeElement) {
        dateTimeElement.innerText =
            now.toLocaleDateString("en-IN", options) + " | " + now.toLocaleTimeString();
    }
}
updateDateTime();
setInterval(updateDateTime, 1000);

// ---------------------- Backend URLs ----------------------
const backendApiUrl = "http://localhost:8080/api/news/fetch-latest";
const backendUsersUrl = "http://localhost:8080/api/users";

// ---------------------- State ----------------------
let selectedCategory = null;
let selectedCountry = "in"; // default country
let allNews = [];

// ---------------------- Fetch News ----------------------
async function fetchNewsFromBackend(country = selectedCountry, category = selectedCategory) {
    const container = document.getElementById("english")?.querySelector("ul");
    if (!container) return;
    container.innerHTML = "<li>Loading news...</li>";

    try {
        let url = backendApiUrl + `?country=${encodeURIComponent(country)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch news (status: ${res.status})`);

        const newsList = await res.json();
        if (!Array.isArray(newsList)) throw new Error("Backend did not return an array of news");

        allNews = newsList;
        renderNews(newsList, "english");
    } catch (err) {
        console.error("Error fetching news:", err);
        container.innerHTML = "<li style='color:red;'>Failed to load news from backend.</li>";
    }
}

// ---------------------- Render News ----------------------
function renderNews(newsList, language) {
    const container = document.getElementById(language)?.querySelector("ul");
    if (!container) return;

    container.innerHTML = "";

    newsList.forEach(news => {
        const title = news.title && news.title.trim() !== "" ? news.title : "No Title";
        const description = news.description && news.description.trim() !== "" ? news.description : "No Description";
        const img = news.imageUrl && news.imageUrl.trim() !== "" ? news.imageUrl : "https://via.placeholder.com/190x101";
        const link = news.url && news.url.trim() !== "" ? news.url : "#";

        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginBottom = "10px";

        li.innerHTML = `
            <img src="${img}" alt="news" style="width: 190px; height: 101px; object-fit: cover; margin-right: 10px;">
            <div style="flex:1">
                <a href="${link}" target="_blank" style="font-weight:bold; color:#174cae; text-decoration:none;">${title}</a>
                <p style="margin:5px 0 0 0; font-size:14px; color:#333;">${description}</p>
            </div>
        `;
        container.appendChild(li);
    });
}

// ---------------------- Search Redirect ----------------------
function goToSearchPage() {
    const keyword = document.getElementById("searchInput").value.trim();
    if(!keyword){
        alert("Please enter a keyword");
        return;
    }
    window.location.href = `search.html?query=${encodeURIComponent(keyword)}`;
}
document.getElementById("searchInput")?.addEventListener("keypress", function(e){
    if(e.key === "Enter") goToSearchPage();
});

// ---------------------- Fetch News by Category ----------------------
function fetchNews(category) {
    selectedCategory = category;
    fetchNewsFromBackend(selectedCountry, selectedCategory);
}

// ---------------------- Fetch Users ----------------------
async function fetchUsers() {
    const container = document.getElementById("usersList");
    if (!container) return;
    container.innerHTML = "<li>Loading users...</li>";

    try {
        const res = await fetch(backendUsersUrl);
        if (!res.ok) throw new Error(`Failed to fetch users (status: ${res.status})`);

        const users = await res.json();
        if (!Array.isArray(users)) throw new Error("Backend did not return an array of users");

        renderUsers(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        container.innerHTML = "<li style='color:red;'>Error loading users</li>";
    }
}

function renderUsers(users) {
    const container = document.getElementById("usersList");
    if (!container) return;
    container.innerHTML = "";
    users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = `${user.id} - ${user.name} (${user.email})`;
        container.appendChild(li);
    });
}

// ---------------------- Tabs ----------------------
function showTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
    document.querySelectorAll(".tab-buttons button").forEach(btn => btn.classList.remove("active"));

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) selectedTab.style.display = "block";

    document.querySelectorAll(".tab-buttons button").forEach(btn => {
        if ((tabName === "english" && btn.innerText.toLowerCase().includes("english")) ||
            (tabName === "backend" && btn.innerText.toLowerCase().includes("users"))) {
            btn.classList.add("active");
        }
    });
}

// ---------------------- Modal ----------------------
const modal = document.getElementById("signupModal");
if (modal) {
    document.getElementById("signUpBtn").onclick = () => modal.style.display = "block";
    document.querySelector(".closeBtn").onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
}

// ---------------------- Password Toggle ----------------------
function togglePassword() {
    const pass = document.getElementById("password");
    const confirmPass = document.getElementById("confirmPassword");
    if (pass && confirmPass) {
        const type = pass.type === "password" ? "text" : "password";
        pass.type = type;
        confirmPass.type = type;
    }
}

// ---------------------- Signup Form ----------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (name.length < 3) return alert("Name कम से कम 3 characters का होना चाहिए!");
        if (!/^[^ ]+@[^ ]+\.[a-z]{2,3}$/.test(email)) return alert("कृपया सही Email डालें!");
        if (password.length < 6) return alert("Password कम से कम 6 characters का होना चाहिए!");
        if (password !== confirmPassword) return alert("Password और Confirm Password match नहीं कर रहे!");

        try {
            const res = await fetch(`${backendUsersUrl}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            if (!res.ok) throw new Error(`Signup failed (status: ${res.status})`);
            const data = await res.json();

            alert("Sign Up Successful! Welcome " + data.name);
            this.reset();
            modal.style.display = "none";
            fetchUsers();
        } catch (err) {
            console.error("Error during signup:", err);
            alert("Signup failed, please try again.");
        }
    });
}

// ---------------------- Login Form ----------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const res = await fetch(`${backendUsersUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (res.status === 404) {
                alert("User not found");
            } else if (res.status === 401) {
                alert("Invalid password");
            } else if (res.ok) {
                const data = await res.text();
                alert(data);
            } else {
                throw new Error(`Unexpected status: ${res.status}`);
            }        
        } catch (err) {
            console.error("Error during login:", err);
            alert("Login failed, please try again.");
        }
    });
}

// ---------------------- Initial Load & Auto Refresh ----------------------
fetchNewsFromBackend(selectedCountry, selectedCategory);
fetchUsers();

setInterval(() => {
    console.log("Refreshing news & users...");
    fetchNewsFromBackend(selectedCountry, selectedCategory);
    fetchUsers();
}, 60000);

// ---------------------- Video Player ----------------------
const videos = ["video1.mp4","video2.mp4","video3.mp4","video4.mp4"];
let current = 0;
const player = document.getElementById("videoPlayer");

videos.forEach(src => {
    const vid = document.createElement("video");
    vid.src = src;
    vid.preload = "auto";
});

function playNextVideo() {
    current++;
    if (current >= videos.length) current = 0;
    player.src = videos[current];
    player.load();
    player.addEventListener("canplaythrough", () => player.play(), { once: true });
}

player.addEventListener("ended", playNextVideo);
player.src = videos[current];
player.load();
player.addEventListener("canplaythrough", () => player.play(), { once: true });

// ---------------------- Theme Toggle ----------------------
const themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerText = 'Light Mode';
} else {
    themeToggle.innerText = 'Dark Mode';
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if(document.body.classList.contains('dark-mode')) {
        themeToggle.innerText = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.innerText = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    }
});
