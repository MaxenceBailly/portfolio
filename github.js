// ⚠️ ATTENTION : Remplacez par votre vrai token GitHub personnel
const GITHUB_TOKEN = ''; // Laissez vide ou mettez votre vrai token

// Système de cache avancé
class GitHubCache {
    constructor(ttl = 10 * 60 * 1000) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }
}

const githubCache = new GitHubCache(15 * 60 * 1000);

// Fonction pour extraire les images du README
async function extractImagesFromReadme(repoFullName, headers) {
    try {
        const readmeUrl = `https://api.github.com/repos/${repoFullName}/readme`;
        const readmeResponse = await fetch(readmeUrl, { headers });
        
        if (!readmeResponse.ok) {
            console.log(`📄 Pas de README trouvé pour ${repoFullName}`);
            return [];
        }

        const readmeData = await readmeResponse.json();
        const readmeContent = atob(readmeData.content); // Décodage base64
        
        // Regex améliorée pour extraire les images (incluant le nouveau format GitHub)
        const imageRegex = /!\[[^\]]*\]\((?<url>[^)\s]+)(?:\s+"[^"]*")?\)|<img[^>]+src=["'](?<url2>[^"'\s]+)["']/gi;
        
        const images = new Set();
        let match;
        
        while ((match = imageRegex.exec(readmeContent)) !== null) {
            let imageUrl = match.groups?.url || match.groups?.url2 || match[1] || match[2];
            
            if (!imageUrl) continue;
            
            // Nettoyer l'URL
            imageUrl = imageUrl.trim().replace(/["']/g, '');
            
            // Convertir les URLs relatives en URLs absolues
            if (imageUrl.startsWith('./')) {
                imageUrl = `https://raw.githubusercontent.com/${repoFullName}/${readmeData.branch_name || 'main'}/${imageUrl.substring(2)}`;
            } else if (imageUrl.startsWith('../')) {
                imageUrl = `https://raw.githubusercontent.com/${repoFullName}/${readmeData.branch_name || 'main'}/${imageUrl}`;
            } else if (!imageUrl.match(/^https?:\/\//)) {
                // URL relative sans ./ ou ../
                imageUrl = `https://raw.githubusercontent.com/${repoFullName}/${readmeData.branch_name || 'main'}/${imageUrl}`;
            }
            
            // Vérifier que c'est bien une image (incluant les URLs GitHub assets)
            if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
                imageUrl.includes('github.com/user-attachments/assets/')) {
                // Pour les URLs GitHub assets, on les utilise directement
                images.add(imageUrl);
            }
        }

        const imageArray = Array.from(images);
        console.log(`📸 ${imageArray.length} images trouvées dans ${repoFullName}`, imageArray);
        return imageArray;
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'extraction des images pour ${repoFullName}:`, error);
        return [];
    }
}

// Fonction pour créer le carousel d'images
function createImageCarousel(images, projectId) {
    if (!images || images.length === 0) {
        return `<div style="font-size: 4rem; color: #6366f1;">📁</div>`;
    }

    const carouselId = `carousel-${projectId}`;
    let carouselHTML = `
        <div class="image-carousel" id="${carouselId}" style="width:100%; height:100%; position:relative; overflow:hidden;">
    `;

    // Ajouter toutes les images avec transition de fondu
    images.forEach((image, index) => {
        // Vérifier si c'est une URL GitHub assets
        const isGitHubAsset = image.includes('github.com/user-attachments/assets/');
        // Utiliser l'URL directe pour les assets GitHub
        const finalImageUrl = isGitHubAsset ? image : image;
        
        carouselHTML += `
            <img src="${finalImageUrl}" 
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
                 onerror="this.style.display='none'; console.error('Erreur de chargement de l\\'image: ${finalImageUrl}')"
                 onload="this.style.opacity='1'">
        `;
    });

    // Ajouter les points de navigation si plus d'une image
    if (images.length > 1) {
        carouselHTML += `
            <div class="carousel-nav" style="
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 5px;
                z-index: 10;
            ">
        `;
        
        for (let i = 0; i < images.length; i++) {
            carouselHTML += `
                <div class="carousel-dot ${i === 0 ? 'active' : ''}" 
                     onclick="switchCarouselImage('${carouselId}', ${i})"
                     style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: ${i === 0 ? '#6366f1' : 'rgba(255,255,255,0.5)'};
                        cursor: pointer;
                        transition: all 0.3s ease;
                     ">
                </div>
            `;
        }
        carouselHTML += `</div>`;
    }

    carouselHTML += `</div>`;

    // Démarrer l'auto-rotation après un délai
    setTimeout(() => {
        if (images.length > 1) {
            startCarouselRotation(carouselId, images.length);
        }
    }, 2000);

    return carouselHTML;
}

// Fonction pour changer d'image dans le carousel
function switchCarouselImage(carouselId, targetIndex) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const images = carousel.querySelectorAll('img');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    // Masquer toutes les images avec fondu
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
            }, 500); // Correspond à la durée de la transition
        }
    });

    // Mettre à jour les points de navigation
    dots.forEach((dot, index) => {
        dot.style.background = index === targetIndex ? '#6366f1' : 'rgba(255,255,255,0.5)';
    });

    // Stocker l'index actuel
    carousel.dataset.currentIndex = targetIndex;
}

// Fonction pour démarrer la rotation automatique
function startCarouselRotation(carouselId, imageCount) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    let currentIndex = parseInt(carousel.dataset.currentIndex || 0);
    let rotationInterval;
    
    const rotate = () => {
        currentIndex = (currentIndex + 1) % imageCount;
        switchCarouselImage(carouselId, currentIndex);
    };
    
    rotationInterval = setInterval(rotate, 3000); // Rotation toutes les 3 secondes

    // Arrêter la rotation au survol
    carousel.addEventListener('mouseenter', () => {
        clearInterval(rotationInterval);
    });

    // Reprendre la rotation quand la souris sort
    carousel.addEventListener('mouseleave', () => {
        rotationInterval = setInterval(rotate, 3000);
    });
}

// Fonction principale avec meilleure gestion d'erreurs
async function loadGithubProjects() {
    const username = 'maxencebailly';
    const container = document.getElementById('githubProjects');
    const cacheKey = `github_projects_${username}`;

    // Vérifier le cache
    const cachedData = githubCache.get(cacheKey);
    if (cachedData) {
        console.log('📦 Données chargées depuis le cache');
        container.innerHTML = cachedData;
        return;
    }

    container.innerHTML = '<div class="loading">🔄 Chargement des projets GitHub...</div>';

    // Configuration des headers
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-Website'
    };

    // Ajouter le token seulement s'il semble valide
    if (GITHUB_TOKEN && GITHUB_TOKEN.startsWith('ghp_') && GITHUB_TOKEN.length > 20) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        console.log('🔑 Token détecté, utilisation de l\'authentification');
    } else {
        console.warn('⚠️ Token manquant ou invalide, utilisation sans authentification (limite : 60 req/h)');
    }

    try {
        // Test de connexion à l'API avec gestion d'erreur améliorée
        console.log('🔍 Test de connexion à l\'API GitHub...');
        
        const testResponse = await fetch('https://api.github.com/rate_limit', { headers });
        
        if (testResponse.ok) {
            const rateLimit = await testResponse.json();
            
            // Vérifier la structure de la réponse
            const rateLimitInfo = rateLimit.rate || rateLimit.resources?.core || { remaining: 60, limit: 60 };
            
            console.log('📊 Limite de taux:', {
                remaining: rateLimitInfo.remaining,
                limit: rateLimitInfo.limit,
                reset: rateLimitInfo.reset ? new Date(rateLimitInfo.reset * 1000).toLocaleTimeString() : 'Inconnu'
            });

            if (rateLimitInfo.remaining < 5) {
                console.warn(`⚠️ Limite de taux faible (${rateLimitInfo.remaining}/${rateLimitInfo.limit})`);
            }
        } else {
            console.warn('⚠️ Impossible de vérifier la limite de taux, continuation...');
        }

        // Récupération des repositories
        console.log(`🔄 Récupération des repos pour ${username}...`);
        const reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=20&type=public`;
        
        const reposResponse = await fetch(reposUrl, { headers });
        
        if (!reposResponse.ok) {
            const errorData = await reposResponse.json().catch(() => ({}));
            console.error('❌ Erreur API:', {
                status: reposResponse.status,
                statusText: reposResponse.statusText,
                message: errorData.message || 'Erreur inconnue'
            });
            
            if (reposResponse.status === 404) {
                throw new Error(`❌ Utilisateur '${username}' non trouvé`);
            } else if (reposResponse.status === 401) {
                throw new Error('❌ Token GitHub invalide ou expiré');
            } else if (reposResponse.status === 403) {
                throw new Error('❌ Limite de taux dépassée ou accès refusé');
            } else {
                throw new Error(`❌ Erreur API: ${reposResponse.status} - ${errorData.message || reposResponse.statusText}`);
            }
        }

        const repos = await reposResponse.json();
        console.log(`✅ ${repos.length} repositories trouvés`);

        if (!Array.isArray(repos) || repos.length === 0) {
            container.innerHTML = '<div class="error">❌ Aucun repository public trouvé</div>';
            return;
        }

        // Génération du HTML avec extraction des images
        let projectsHTML = '';
        const maxRepos = Math.min(repos.length, 12);

        container.innerHTML = '<div class="loading">🔄 Chargement des projets et extraction des images...</div>';

        for (let i = 0; i < maxRepos; i++) {
            const repo = repos[i];
            
            const stars = repo.stargazers_count || 0;
            const forks = repo.forks_count || 0;
            const language = repo.language || 'N/A';
            const description = repo.description || 'Aucune description disponible';
            const homepage = repo.homepage;
            const lastUpdate = new Date(repo.updated_at).toLocaleDateString('fr-FR');

            // Extraire les images du README
            console.log(`📸 Extraction des images pour ${repo.full_name}...`);
            const images = await extractImagesFromReadme(repo.full_name, headers);
            
            // Créer le carousel ou l'icône par défaut
            const imageContent = images.length > 0 
                ? createImageCarousel(images, repo.id)
                : `<div style="font-size: 4rem; color: #6366f1;">${getLanguageIcon(language)}</div>`;

            projectsHTML += `
                <div class="project-card">
                    <div class="project-image">
                        ${imageContent}
                    </div>
                    <div class="project-content">
                        <div class="project-header">
                            <div>
                                <h3 class="project-title">${repo.name}</h3>
                                <div class="project-stats">
                                    <span class="project-stat">⭐ ${stars}</span>
                                    <span class="project-stat">🍴 ${forks}</span>
                                    <span class="project-stat">💻 ${language}</span>
                                    ${images.length > 0 ? `<span class="project-stat">📸 ${images.length}</span>` : ''}
                                </div>
                                <small style="color: #888;">Mis à jour le ${lastUpdate}</small>
                            </div>
                        </div>
                        <p class="project-description">${description}</p>
                        <div class="project-links">
                            <a href="${repo.html_url}" target="_blank" class="project-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                Code source
                            </a>
                            ${homepage ? 
                                `<a href="${homepage}" target="_blank" class="project-link">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    Site web
                                </a>` : ''
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        // Sauvegarder dans le cache et afficher
        githubCache.set(cacheKey, projectsHTML);
        container.innerHTML = projectsHTML;
        console.log('✅ Projets chargés avec succès et mis en cache');

    } catch (error) {
        console.error('❌ Erreur détaillée:', error);
        
        let errorMessage = '';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '🌐 Problème de connexion réseau. Vérifiez votre connexion internet.';
        } else if (error.message.includes('Token')) {
            errorMessage = '🔑 Problème avec le token GitHub. Vérifiez qu\'il est valide et actif.';
        } else {
            errorMessage = `❌ ${error.message}`;
        }
        
        container.innerHTML = `
            <div class="error">
                <h3>Erreur lors du chargement des projets</h3>
                <p>${errorMessage}</p>
                <button onclick="loadGithubProjects()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}

// Fonction utilitaire pour les icônes
function getLanguageIcon(language) {
    const icons = {
        'JavaScript': '🟨',
        'TypeScript': '🔷',
        'Python': '🐍',
        'Java': '☕',
        'C++': '⚡',
        'C#': '🔷',
        'Go': '🐹',
        'Rust': '🦀',
        'PHP': '🐘',
        'Ruby': '💎',
        'Swift': '🐦',
        'Kotlin': '🟣',
        'Dart': '🎯',
        'Shell': '🐚',
        'HTML': '🌐',
        'CSS': '🎨',
        'Vue': '💚',
        'React': '⚛️',
        'Angular': '🅰️'
    };
    
    return icons[language] || '📁';
}

// Instructions pour créer un token GitHub
function showTokenInstructions() {
    console.log(`
🔑 COMMENT CRÉER UN TOKEN GITHUB PERSONNEL :

1. 🌐 Allez sur : https://github.com/settings/tokens
2. ➕ Cliquez sur "Generate new token" > "Generate new token (classic)"
3. 📝 Donnez un nom : "Portfolio Website"
4. ⏰ Choisissez une expiration (30 jours, 90 jours, etc.)
5. ✅ Sélectionnez les permissions :
   - ✅ public_repo (pour lire vos repos publics)
   - ✅ read:user (pour lire votre profil)
6. 🎯 Cliquez sur "Generate token"
7. 📋 COPIEZ le token immédiatement (vous ne le reverrez plus !)
8. 🔄 Remplacez la valeur de GITHUB_TOKEN dans ce fichier

⚠️ IMPORTANT : 
- Ne partagez JAMAIS votre token
- Le token doit commencer par "ghp_"
- Il doit faire environ 40 caractères

🔍 Token actuel détecté : ${GITHUB_TOKEN ? (GITHUB_TOKEN.startsWith('ghp_') ? '✅ Format correct' : '❌ Format incorrect') : '❌ Manquant'}
    `);
}

// Fonction pour tester le token
async function testGitHubToken() {
    if (!GITHUB_TOKEN || !GITHUB_TOKEN.startsWith('ghp_')) {
        console.error('❌ Token invalide ou manquant');
        showTokenInstructions();
        return false;
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('✅ Token valide ! Connecté en tant que:', userData.login);
            return true;
        } else {
            console.error('❌ Token invalide ou expiré');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors du test du token:', error);
        return false;
    }
}

// Fonction pour forcer le rechargement
function refreshGitHubData() {
    githubCache.clear();
    loadGithubProjects();
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation du module GitHub...');
    if (!GITHUB_TOKEN) {
        showTokenInstructions();
    }
    loadGithubProjects();
});

// Export pour utilisation globale
window.loadGithubProjects = loadGithubProjects;
window.refreshGitHubData = refreshGitHubData;
window.testGitHubToken = testGitHubToken;
window.switchCarouselImage = switchCarouselImage;