document.addEventListener('DOMContentLoaded', () => {
    // Configuration des projets
    const projectsConfig = {
        "lyon_lumiere": {
            title: "Lyon Lumière",
            description: "Site présentant Lyon avec pour thème initial \"Lumière\". Celui-ci permet de voyager à tavars Lyon et ses monument lors d'une expérience inoubliable. Nous avons eu la 4e place sur 39 équipes",
            year: "2024",
            technologies: ["HTML", "CSS", "JavaScript"],
            links: [
                { url: "https://miinnee.github.io/BlockChainersEpreuveWeb/", text: "Voir le projet", icon: "external-link" }
            ],
            images: [
                "1.png",
                "2.png",
                "3.png",
                "4.png",
                "5.png"
            ]
        },
        "nom_projet_2": {
            // Configuration similaire pour le projet 2
        }
    };

    // Pour chaque projet
    document.querySelectorAll('.project-card[data-project]').forEach(card => {
        const projectId = card.getAttribute('data-project');
        const project = projectsConfig[projectId];
        const imageContainer = card.querySelector('.project-image');
        
        // Supprimer le loader
        imageContainer.innerHTML = '';
        
        // Créer le carrousel
        createManualCarousel(projectId, project.images, imageContainer);
        
        // Mettre à jour les infos du projet
        if (project) {
            const titleEl = card.querySelector('.project-title');
            const descEl = card.querySelector('.project-description');
            const statsEl = card.querySelector('.project-stats');
            const linksEl = card.querySelector('.project-links');
            
            if (titleEl) titleEl.textContent = project.title;
            if (descEl) descEl.textContent = project.description;
            
            // Mettre à jour les stats
            if (statsEl) {
                statsEl.innerHTML = `
                    ${project.technologies.map(tech => `<span class="project-stat">💻 ${tech}</span>`).join('')}
                    <span class="project-stat">📅 ${project.year}</span>
                `;
            }
            
            // Mettre à jour les liens
            if (linksEl && project.links) {
                linksEl.innerHTML = project.links.map(link => `
                    <a href="${link.url}" target="_blank" class="project-link">
                        ${link.icon === 'github' ? `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        ` : `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        `}
                        ${link.text}
                    </a>
                `).join('');
            }
        }
    });
});

function createManualCarousel(projectId, images, container) {
    const basePath = `assets/images/${projectId}/`;
    const carouselId = `manual-carousel-${projectId}`;
    
    if (!images || images.length === 0) {
        container.innerHTML = `<div style="font-size: 4rem; color: #6366f1;">📁</div>`;
        return;
    }

    let carouselHTML = `
        <div class="image-carousel" id="${carouselId}">
    `;

    // Ajouter toutes les images
    images.forEach((image, index) => {
        carouselHTML += `
            <img src="${basePath}${image}" 
                 alt="Screenshot ${index + 1}" 
                 style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    background: #1a1a1a;
                    display: ${index === 0 ? 'block' : 'none'};
                    opacity: ${index === 0 ? '1' : '0'};
                    transition: opacity 1s ease;
                 "
                 onerror="this.style.display='none'; console.error('Erreur de chargement de l\\'image: ${basePath}${image}')"
                 onload="this.style.opacity='1'">
        `;
    });

    // Ajouter les points de navigation si plus d'une image
    if (images.length > 1) {
        carouselHTML += `
            <div class="carousel-nav">
        `;
        
        for (let i = 0; i < images.length; i++) {
            carouselHTML += `
                <div class="carousel-dot ${i === 0 ? 'active' : ''}" 
                     onclick="switchManualCarouselImage('${carouselId}', ${i})"
                     style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: ${i === 0 ? '#4ade80' : 'rgba(255,255,255,0.5)'};
                        cursor: pointer;
                        transition: all 0.3s ease;
                     ">
                </div>
            `;
        }
        carouselHTML += `</div>`;
    }

    carouselHTML += `</div>`;
    container.innerHTML = carouselHTML;

    // Démarrer l'auto-rotation si plusieurs images
    if (images.length > 1) {
        startManualCarouselRotation(carouselId, images.length);
    }
}

// Fonction pour changer d'image dans le carrousel manuel
function switchManualCarouselImage(carouselId, targetIndex) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const images = carousel.querySelectorAll('img');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    images.forEach((img, index) => {
        if (index === targetIndex) {
            img.style.display = 'block';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 20);
        } else {
            img.style.opacity = '0';
            setTimeout(() => {
                img.style.display = 'none';
            }, 500);
        }
    });

    dots.forEach((dot, index) => {
        dot.style.background = index === targetIndex ? '#4ade80' : 'rgba(255,255,255,0.5)';
    });

    carousel.dataset.currentIndex = targetIndex;
}

// Fonction pour démarrer la rotation automatique
function startManualCarouselRotation(carouselId, imageCount) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    let currentIndex = parseInt(carousel.dataset.currentIndex || 0);
    let rotationInterval;
    
    const rotate = () => {
        currentIndex = (currentIndex + 1) % imageCount;
        switchManualCarouselImage(carouselId, currentIndex);
    };
    
    rotationInterval = setInterval(rotate, 3000);

    // Arrêter la rotation au survol
    carousel.addEventListener('mouseenter', () => {
        clearInterval(rotationInterval);
    });

    // Reprendre la rotation quand la souris sort
    carousel.addEventListener('mouseleave', () => {
        rotationInterval = setInterval(rotate, 3000);
    });
}

// Export pour utilisation globale
window.switchManualCarouselImage = switchManualCarouselImage;