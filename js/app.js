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
  orderBy,
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

// Authentication Handling
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form submission and page refresh
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Error logging in: ", error);
        alert("Login failed. Please check your credentials.");
      });
  });
}

const resetPasswordForm = document.getElementById("reset-password-form");
if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form submission and page refresh
    const email = document.getElementById("email").value;
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Error resetting password: ", error);
        alert("Failed to send password reset email. Please try again.");
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
        e.preventDefault(); // Prevent form submission and page refresh
        const userEmail = document.getElementById("user-email").value;
        const userPassword = document.getElementById("user-password").value;
        try {
          await createUserWithEmailAndPassword(auth, userEmail, userPassword);
          alert("User added successfully!");
          addUserForm.reset();
        } catch (error) {
          console.error("Error adding user: ", error);
          alert("Failed to add user. Please try again.");
        }
      });
    }

    // Add Birthday
    const addBirthdayForm = document.getElementById("add-birthday-form");
    if (addBirthdayForm) {
      addBirthdayForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form submission and page refresh
        const fullName = document.getElementById("full-name").value;
        const dob = document.getElementById("dob").value;
        const profilePhotoInput = document.getElementById("profile-photo");
        const profilePhoto = profilePhotoInput.files[0];

        if (!profilePhoto) {
          alert("Please upload a profile photo.");
          return;
        }

        try {
          // Upload profile photo to Firebase Storage
          const storageRef = ref(storage, `profiles/${profilePhoto.name}_${Date.now()}`);
          await uploadBytes(storageRef, profilePhoto);
          const photoURL = await getDownloadURL(storageRef);

          // Add birthday data to Firestore
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
        }
      });
    }
  } else {
    // User is signed out
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== "login.html" && currentPage !== "reset-password.html") {
      window.location.href = "login.html";
    }
  }
});

// Display Birthdays
const displayBirthdays = async () => {
  try {
    const q = query(collection(db, "birthdays"), orderBy("dob"));
    const querySnapshot = await getDocs(q);
    const birthdaysList = document.getElementById("birthdays-list");
    const upcomingList = document.getElementById("upcoming-list");

    if (birthdaysList || upcomingList) {
      querySnapshot.forEach((doc) => {
        const birthday = doc.data();
        const birthdayCard = `
          <div class="card">
            <img src="${birthday.photoURL}" alt="${birthday.fullName}">
            <h2>${birthday.fullName}</h2>
            <p>${new Date(birthday.dob).toLocaleDateString()}</p>
          </div>
        `;
        if (birthdaysList) birthdaysList.innerHTML += birthdayCard;

        // Check if the birthday is within the next 3 days
        const today = new Date();
        const birthdayDate = new Date(birthday.dob);
        birthdayDate.setFullYear(today.getFullYear());

        const diffTime = birthdayDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 3) {
          if (upcomingList) upcomingList.innerHTML += birthdayCard;
        }
      });
    }
  } catch (error) {
    console.error("Error fetching birthdays: ", error);
    alert("Failed to load birthdays.");
  }
};

// Initialize Display on Relevant Pages
const birthdaysPage = document.getElementById("birthdays-list");
const upcomingPage = document.getElementById("upcoming-list");

if (birthdaysPage || upcomingPage) {
  displayBirthdays();
}

// Logout
const logoutLink = document.getElementById("logout");
if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default link behavior
    signOut(auth)
      .then(() => {
        alert("Logged out successfully.");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
        alert("Failed to log out. Please try again.");
      });
  });
}