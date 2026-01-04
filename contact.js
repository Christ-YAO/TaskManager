// Gestion du formulaire de contact
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Récupérer les valeurs du formulaire
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Validation côté client
            if (!name || !email || !subject || !message) {
                alert('Veuillez remplir tous les champs.');
                return;
            }
            
            // Validation de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Veuillez entrer une adresse email valide.');
                return;
            }
            
            // Désactiver le bouton de soumission
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Envoi en cours...</span>';
            
            try {
                // Envoyer les données à l'API
                const response = await fetch('api/contact.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Afficher un message de succès
                    alert(result.message || 'Message envoyé avec succès !');
                    
                    // Réinitialiser le formulaire
                    contactForm.reset();
                } else {
                    // Afficher un message d'erreur
                    alert(result.message || 'Une erreur est survenue lors de l\'envoi du message.');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer plus tard.');
            } finally {
                // Réactiver le bouton
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});

