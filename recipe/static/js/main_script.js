// Initialize Supabase client
const SUPABASE_URL = 'https://jfzojphxhgpejvffefvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c';

// Wait for Supabase to load, then create client
let supabaseClient;

// Load recipes when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase client
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
        document.getElementById('recipesGrid').innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">😕</div>
                <h3>Failed to load</h3>
                <p>Supabase library is missing. Please refresh the page.</p>
            </div>
        `;
        return;
    }
    
    await loadRecipes();
});

async function loadRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    
    try {
        console.log('Fetching recipes from Supabase...');
        
        // Fetch all recipes from Supabase
        const { data: recipes, error } = await supabaseClient
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false });

        console.log('Recipes data:', recipes);
        console.log('Error:', error);

        if (error) {
            console.error('Error fetching recipes:', error);
            recipesGrid.innerHTML = `
                <div class="no-recipes">
                    <div class="no-recipes-icon">😕</div>
                    <h3>Failed to load recipes</h3>
                    <p>${error.message || 'Please try refreshing the page'}</p>
                </div>
            `;
            return;
        }

        // Clear loading message
        recipesGrid.innerHTML = '';

        // Check if there are any recipes
        if (!recipes || recipes.length === 0) {
            recipesGrid.innerHTML = `
                <div class="no-recipes">
                    <div class="no-recipes-icon">🍳</div>
                    <h3>No recipes yet</h3>
                    <p>Be the first to share a recipe!</p>
                </div>
            `;
            return;
        }

        // Display each recipe
        recipes.forEach(recipe => {
            const recipeCard = createRecipeCard(recipe);
            recipesGrid.appendChild(recipeCard);
        });

    } catch (err) {
        console.error('Error loading recipes:', err);
        recipesGrid.innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">😕</div>
                <h3>Something went wrong</h3>
                <p>${err.message || 'Please try again later'}</p>
            </div>
        `;
    }
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Format cook time
    const cookTime = recipe.cook_time ? `${recipe.cook_time} min` : 'N/A';
    
    // Create card HTML
    card.innerHTML = `
        ${recipe.cover_photo_url ? 
            `<img src="${recipe.cover_photo_url}" alt="${recipe.title}" class="recipe-image">` : 
            `<div class="recipe-image"></div>`
        }
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            ${recipe.description ? 
                `<p class="recipe-description">${recipe.description}</p>` : 
                ''
            }
            <div class="recipe-meta">
                <div class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span>${cookTime}</span>
                </div>
                ${recipe.cuisine ? 
                    `<div class="meta-item">
                        <span class="meta-icon">🌍</span>
                        <span>${recipe.cuisine}</span>
                    </div>` : 
                    ''
                }
            </div>
            <div class="recipe-tags">
                ${recipe.category ? `<span class="tag">${recipe.category}</span>` : ''}
            </div>
        </div>
    `;
    
    // Add click event (you can expand this later for recipe details)
    card.addEventListener('click', () => {
        console.log('Clicked recipe:', recipe);
        // TODO: Open recipe details modal or navigate to recipe page
    });
    
    return card;
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}