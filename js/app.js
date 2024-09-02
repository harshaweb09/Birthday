import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdZ6bDQzd3u6hDTEc0oYTwdWjM2N2pbHg",
  authDomain: "birthday-b4e29.firebaseapp.com",
  projectId: "birthday-b4e29",
  storageBucket: "birthday-b4e29.appspot.com",
  messagingSenderId: "77110834502",
  appId: "1:77110834502:web:32a0cba869d237c638e147",
  measurementId: "G-GTQYZHR5LP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Show the loading overlay
function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide the loading overlay
function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// Authentication Handling
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    showLoading();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Error logging in: ", error);
        alert("Login failed. Please check your credentials.");
      })
      .finally(() => {
        hideLoading();
      });
  });
}

const resetPasswordForm = document.getElementById("reset-password-form");
if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    showLoading();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Error resetting password: ", error);
        alert("Failed to send password reset email. Please try again.");
      })
      .finally(() => {
        hideLoading();
      });
  });
}

// Admin and User Handling
onAuthStateChanged(auth, (user) => {
  if (user) {
    const welcomeMessage = document.getElementById("welcome-message");
    if (welcomeMessage) {
      if (user.email === "harsha.katari09@gmail.com") {
        const adminSection = document.getElementById("admin-section");
        if (adminSection) adminSection.style.display = "block";
        welcomeMessage.innerHTML = `Welcome Admin, ${user.email}`;
      } else {
        welcomeMessage.innerHTML = `Welcome, ${user.email}`;
      }
    }

    // Add User
    const addUserForm = document.getElementById("add-user-form");
    if (addUserForm) {
      addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        showLoading();
        const userEmail = document.getElementById("user-email").value;
        const userPassword = document.getElementById("user-password").value;
        try {
          await createUserWithEmailAndPassword(auth, userEmail, userPassword);
          alert("User added successfully!");
          addUserForm.reset();
        } catch (error) {
          console.error("Error adding user: ", error);
          alert("Failed to add user. Please try again.");
        } finally {
          hideLoading();
        }
      });
    }

    // Add Birthday
    const addBirthdayForm = document.getElementById("add-birthday-form");
    if (addBirthdayForm) {
      addBirthdayForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        showLoading();
        const fullName = document.getElementById("full-name").value;
        const dob = document.getElementById("dob").value;
        const profilePhotoInput = document.getElementById("profile-photo");
        const profilePhoto = profilePhotoInput.files[0];

        if (!profilePhoto) {
          alert("Please upload a profile photo.");
          hideLoading();
          return;
        }

        try {
          const storageRef = ref(storage, `profiles/${profilePhoto.name}_${Date.now()}`);
          await uploadBytes(storageRef, profilePhoto);
          const photoURL = await getDownloadURL(storageRef);

          await addDoc(collection(db, "birthdays"), {
            fullName,
            dob,
            photoURL
          });
          alert("Birthday added successfully!");
          addBirthdayForm.reset();
        } catch (error) {
          console.error("Error adding birthday: ", error);
          alert("Failed to add birthday. Please try again.");
        } finally {
          hideLoading();
        }
      });
    }
  } else {
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== "login.html" && currentPage !== "reset-password.html") {
      window.location.href = "login.html";
    }
  }
});

// Function to format the date as "July 4th"
const formatDate = (date) => {
  const options = { month: 'long', day: 'numeric' };
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                 day === 2 || day === 22 ? 'nd' :
                 day === 3 || day === 23 ? 'rd' : 'th';
  return date.toLocaleDateString('en-US', options) + suffix;
};

// Function to sort birthdays alphabetically
function sortAlphabetically(birthdays) {
  return birthdays.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

// Function to sort birthdays chronologically by date and month
function sortChronologically(birthdays) {
  return birthdays.sort((a, b) => {
    const [dayA, monthA] = a.dob.split("/").map(Number);
    const [dayB, monthB] = b.dob.split("/").map(Number);
    return monthA === monthB ? dayA - dayB : monthA - monthB;
  });
}

// Display Birthdays
const displayBirthdays = async () => {
  showLoading();
  try {
    const q = query(collection(db, "birthdays"));
    const querySnapshot = await getDocs(q);
    const birthdaysList = document.getElementById("birthdays-list");
    const upcomingList = document.getElementById("upcoming-list");
    const noUpcomingBirthdays = document.getElementById("no-upcoming-birthdays");
    const sortBySelect = document.getElementById('sort-by');

    if (birthdaysList || upcomingList) {
      const birthdaysArray = [];
      querySnapshot.forEach((doc) => {
        const birthday = doc.data();
        birthdaysArray.push(birthday);
      });

      let sortedBirthdays = sortChronologically(birthdaysArray);

      if (sortBySelect) {
        sortBySelect.addEventListener('change', (e) => {
          const sortBy = e.target.value;
          if (sortBy === 'alphabetical') {
            sortedBirthdays = sortAlphabetically(birthdaysArray);
          } else if (sortBy === 'chronological') {
            sortedBirthdays = sortChronologically(birthdaysArray);
          }
          renderBirthdays(sortedBirthdays, birthdaysList);
        });

        const defaultSortValue = sortBySelect.value;
        if (defaultSortValue === 'alphabetical') {
          sortedBirthdays = sortAlphabetically(birthdaysArray);
        } else if (defaultSortValue === 'chronological') {
          sortedBirthdays = sortChronologically(birthdaysArray);
        }
        renderBirthdays(sortedBirthdays, birthdaysList);
      }

      if (upcomingList) {
        const today = new Date();
        const upcomingBirthdays = sortedBirthdays.filter(birthday => {
          const [day, month] = birthday.dob.split("/").map(Number);
          const birthdayDate = new Date(today.getFullYear(), month - 1, day);

          const diffTime = birthdayDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return diffDays > 0 && diffDays <= 7;
        });

        renderBirthdays(upcomingBirthdays, upcomingList);

        if (noUpcomingBirthdays) {
          noUpcomingBirthdays.style.display = upcomingBirthdays.length === 0 ? 'block' : 'none';
        }
      }
    }
  } catch (error) {
    console.error("Error fetching birthdays: ", error);
    alert("Failed to load birthdays.");
  } finally {
    hideLoading();
  }
};

// Function to render birthdays into a given container
function renderBirthdays(birthdaysArray, container) {
  if (!container) return;
  container.innerHTML = '';

  birthdaysArray.forEach(birthday => {
    const [day, month, year] = birthday.dob.split("/");
    const dob = new Date(`${year}-${month}-${day}`);
    const formattedDate = formatDate(dob);

    const birthdayCard = 
      `<div class="card">
        <img src="${birthday.photoURL}" alt="${birthday.fullName}">
        <h2>${birthday.fullName}</h2>
        <p>${formattedDate}</p>
      </div>`;
    container.innerHTML += birthdayCard;
  });
}

// Display Today's Birthday Card or Message
const displayTodaysBirthday = async () => {
  showLoading();
  try {
    const q = query(collection(db, "birthdays"));
    const querySnapshot = await getDocs(q);
    const todaysBirthdayCard = document.getElementById("todays-birthday-card");
    const noBirthdayMessage = document.getElementById("no-birthday-message");
    const todayHeader = document.getElementById("today-birth");

    if (todaysBirthdayCard && noBirthdayMessage && todayHeader) {
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;

      let foundTodayBirthday = false;

      // Clear previous content
      todaysBirthdayCard.innerHTML = '';

      querySnapshot.forEach((doc) => {
        const birthday = doc.data();
        const [day, month] = birthday.dob.split("/").map(Number);

        if (day === todayDay && month === todayMonth) {
          foundTodayBirthday = true;
          const formattedDate = formatDate(today);

          const birthdayCard = `
            <div class="card">
              <img src="${birthday.photoURL}" alt="${birthday.fullName}">
              <h2>${birthday.fullName}</h2>
              <p>${formattedDate}</p>
            </div>`;

          // Append each birthday card to the container
          todaysBirthdayCard.innerHTML += birthdayCard;
          todaysBirthdayCard.style.display = 'block';
        }
      });

      if (foundTodayBirthday) {
        noBirthdayMessage.style.display = 'none';
        todayHeader.style.display = 'block';
      } else {
        noBirthdayMessage.style.display = 'block';
        todayHeader.style.display = 'none';
        todaysBirthdayCard.style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error fetching today's birthday: ", error);
    alert("Failed to load today's birthday.");
  } finally {
    hideLoading();
  }
};

// Initialize Display on Relevant Pages
const birthdaysPage = document.getElementById("birthdays-list");
const upcomingPage = document.getElementById("upcoming-list");
const todaysBirthdayPage = document.getElementById("todays-birthday-card");

if (birthdaysPage || upcomingPage) {
  displayBirthdays();
}

if (todaysBirthdayPage) {
  displayTodaysBirthday();
}

// Logout
const logoutLink = document.getElementById("logout");
if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    showLoading();
    signOut(auth)
      .then(() => {
        alert("Logged out successfully.");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
        alert("Failed to log out. Please try again.");
      })
      .finally(() => {
        hideLoading();
      });
  });
}