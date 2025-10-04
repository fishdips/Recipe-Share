// !! need to hide this key later --------------------------------
const SUPABASE_URL = 'https://jfzojphxhgpejvffefvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c';
// ----------------------------------------------------------------------
let supabaseClient;
let allRecipes = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
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
    
    setupSearchAndFilter();
    
    await loadRecipes();
});

function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterRecipes(searchTerm, currentFilter);
    });
    
    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        const searchTerm = searchInput.value.toLowerCase();
        filterRecipes(searchTerm, currentFilter);
    });
}

function filterRecipes(searchTerm, filter) {
    let filtered = allRecipes;
    
    if (filter === 'my') {
        if (window.CURRENT_USERNAME) {
            filtered = filtered.filter(recipe => {
                const recipeName = recipe.users?.full_name;
                return recipeName === window.CURRENT_USERNAME;
            });
        }
    } 
    else if (filter !== 'all') {
        filtered = filtered.filter(recipe => 
            recipe.cuisine && recipe.cuisine.toLowerCase() === filter.toLowerCase()
        );
    }
    
    if (searchTerm) {
        filtered = filtered.filter(recipe => {
            const title = recipe.title ? recipe.title.toLowerCase() : '';
            const description = recipe.description ? recipe.description.toLowerCase() : '';
            const ingredients = recipe.ingredients ? JSON.stringify(recipe.ingredients).toLowerCase() : '';
            
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   ingredients.includes(searchTerm);
        });
    }
    
    displayRecipes(filtered);
}

async function loadRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    
    try {
        console.log('Fetching recipes from Supabase...');
        
        const { data: recipes, error } = await supabaseClient
            .from('recipes')
            .select(`
                *,
                users!recipes_author_id_fkey (
                    full_name,
                    email
                )
            `)
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

        allRecipes = recipes || [];
        
        displayRecipes(allRecipes);

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

function displayRecipes(recipes) {
    const recipesGrid = document.getElementById('recipesGrid');
    const recipeCount = document.getElementById('recipeCount');
    const recipesTitle = document.querySelector('.recipes-title');
    
    recipesGrid.innerHTML = '';
    
    recipeCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`;
    
    if (currentFilter === 'my') {
        recipesTitle.textContent = 'My Recipes';
    } else if (currentFilter === 'all') {
        recipesTitle.textContent = 'All Recipes';
    } else {
        recipesTitle.textContent = `${currentFilter} Recipes`;
    }
    
    if (!recipes || recipes.length === 0) {
        recipesGrid.innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">🍳</div>
                <h3>No recipes found</h3>
                <p>${currentFilter === 'my' ? 'You haven\'t added any recipes yet!' : 'Be the first to share a recipe!'}</p>
            </div>
        `;
        return;
    }

    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesGrid.appendChild(recipeCard);
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const cookTime = recipe.cook_time ? `${recipe.cook_time} min` : 'N/A';
    
    const recipeFullName = recipe.users?.full_name;
    const isMyRecipe = window.CURRENT_USERNAME && recipeFullName === window.CURRENT_USERNAME;
    
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
                ${isMyRecipe ? 
                    `<div class="meta-item">
                        <span class="meta-icon">👤</span>
                        <span>Your Recipe</span>
                    </div>` : 
                    recipeFullName ? 
                    `<div class="meta-item">
                        <span class="meta-icon">👤</span>
                        <span>By ${recipeFullName}</span>
                    </div>` : 
                    ''
                }
            </div>
            <div class="recipe-tags">
                ${recipe.category ? `<span class="tag">${recipe.category}</span>` : ''}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        console.log('Clicked recipe:', recipe);
        // For recipe clicks ----------------------------
        alert(`Recipe: ${recipe.title}\n\nNO Click functionality`);
    });
    
    return card;
}

//For date functionality
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