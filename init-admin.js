// Script d'initialisation pour créer un compte admin
// Exécutez ce script dans la console du navigateur ou ajoutez-le à votre page

(function () {
  // Vérifier si l'admin existe déjà
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const adminExists = users.some((u) => u.role === "admin");

  if (adminExists) {
    console.log("Un compte admin existe déjà.");
    return;
  }

  // Créer le compte admin
  const adminUser = {
    id: "admin-" + Date.now().toString(),
    name: "Administrateur",
    email: "admin@taskmanager.com",
    password: "admin123", // Changez ce mot de passe après la première connexion
    role: "admin",
  };

  users.push(adminUser);
  localStorage.setItem("users", JSON.stringify(users));

  // console.log("Compte admin créé avec succès !");
  // console.log("Email: admin@taskmanager.com");
  // console.log("Mot de passe: admin123");
  // console.log(
  //   "⚠️  Veuillez changer le mot de passe après la première connexion."
  // );
})();
