// Authentication logic
document.addEventListener("DOMContentLoaded", function () {
  // L'admin est maintenant créé dans la base de données
  // Voir api/init_admin.php pour créer le compte admin

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");

  // Check if user is already logged in
  if (localStorage.getItem("currentUser")) {
    window.location.href = "dashboard.html";
    return;
  }

  // Toggle between login and register forms
  if (showRegister) {
    showRegister.addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", function (e) {
      e.preventDefault();
      registerForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });
  }

  // Handle login
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Désactiver le bouton de soumission
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = "<span>Connexion...</span>";

      try {
        const response = await fetch("api/login.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const user = result.data;
          // Convertir l'ID en string pour compatibilité
          user.id = user.id.toString();

          // Save current user
          localStorage.setItem("currentUser", JSON.stringify(user));

          // Check if user has access to another user's dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const ownerId = urlParams.get("ownerId");

          if (ownerId && ownerId !== user.id) {
            // Check if user is authorized
            const authorizedEmails = JSON.parse(
              localStorage.getItem("authorizedEmails") || "{}"
            );
            const authorizedList = authorizedEmails[ownerId] || [];

            if (!authorizedList.includes(user.email.toLowerCase())) {
              // User not authorized, redirect to own dashboard
              window.location.href = "dashboard.html";
              return;
            }
          }

          window.location.href = "dashboard.html";
        } else {
          alert(result.message || "Email ou mot de passe incorrect");
        }
      } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue. Veuillez réessayer plus tard.");
      } finally {
        // Réactiver le bouton
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }

  // Handle registration
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;

      // Désactiver le bouton de soumission
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = "<span>Inscription...</span>";

      try {
        const response = await fetch("api/register.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const newUser = result.data;
          // Convertir l'ID en string pour compatibilité
          newUser.id = newUser.id.toString();

          // Save current user
          localStorage.setItem("currentUser", JSON.stringify(newUser));

          alert(result.message || "Inscription réussie !");
          window.location.href = "dashboard.html";
        } else {
          alert(result.message || "Erreur lors de l'inscription");
        }
      } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue. Veuillez réessayer plus tard.");
      } finally {
        // Réactiver le bouton
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  }
});

// Logout function
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
