// Gestion du formulaire de contact
document.querySelector('.contact-form form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Créer le lien mailto
    const mailtoLink = `mailto:maxence.bailly.fr@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    
    // Ouvrir le client email
    window.location.href = mailtoLink;
    
    // Optionnel: Afficher un message de confirmation
    alert('Votre client email va s\'ouvrir avec le message pré-rempli.');
});