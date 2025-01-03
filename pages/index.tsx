import type { NextPage } from 'next';
import React from 'react';
import { Recipe, recipes } from './data/recipe';

interface CombinedRecipe {
    name: string;
    price: string;
    cost: number;
    materials: Material[];
    totalMaterials: Material[];
    subRecipes?: CombinedRecipe[];
}
interface Material {
    name: string;
    quantity: number;
}

const Home: NextPage = () => {
    const [filterText, setFilterText] = React.useState('');
    const [allExpanded, setAllExpanded] = React.useState(false);

    // かな/カナの正規化
    const normalizeKana = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[ぁ-ん]/g, (m) => String.fromCharCode(m.charCodeAt(0) + 0x60))
            .replace(/[ァ-ン]/g, (m) => m);
    };

    // レシピに含まれる全材料の計算
    const calculateTotalMaterials = (recipe: CombinedRecipe): Material[] => {
        const totalMap = new Map<string, number>();

        recipe.materials.forEach((material) => {
            totalMap.set(material.name, (totalMap.get(material.name) || 0) + material.quantity);
        });

        recipe.subRecipes?.forEach((subRecipe) => {
            const subMaterials = calculateTotalMaterials(subRecipe);
            subMaterials.forEach((material) => {
                totalMap.set(material.name, (totalMap.get(material.name) || 0) + material.quantity);
            });
        });

        return Array.from(totalMap.entries()).map(([name, quantity]) => ({
            name,
            quantity,
        }));
    };

    // レシピ名からレシピを再帰的に検索
    const findRecipeByName = (
        name: string,
        recipeList: Recipe[],
        usedRecipes: Set<string> = new Set()
    ): CombinedRecipe | null => {
        if (usedRecipes.has(name)) return null;

        const filteredRecipes = recipeList.filter((recipe) => recipe.name === name);
        if (filteredRecipes.length === 0) return null;

        usedRecipes.add(name);

        const materialMap = new Map<string, number>();
        filteredRecipes.forEach((r) => {
            const currentQuantity = materialMap.get(r.material) || 0;
            materialMap.set(r.material, currentQuantity + r.quantity);
        });

        const recipe: CombinedRecipe = {
            name: filteredRecipes[0].name,
            price: filteredRecipes[0].price,
            cost: filteredRecipes[0].cost,
            materials: Array.from(materialMap.entries()).map(([name, quantity]) => ({
                name,
                quantity,
            })),
            totalMaterials: [],
        };

        recipe.subRecipes = recipe.materials
            .map((material) => findRecipeByName(material.name, recipeList, usedRecipes))
            .filter((r): r is CombinedRecipe => r !== null);

        recipe.totalMaterials = calculateTotalMaterials(recipe);

        return recipe;
    };

    const allRecipes = Array.from(new Set(recipes.map((r) => r.name)))
        .map((name) => findRecipeByName(name, recipes, new Set()))
        .filter((r): r is CombinedRecipe => r !== null);

    const filteredRecipes = allRecipes.filter((recipe) =>
        normalizeKana(recipe.name).includes(normalizeKana(filterText))
    );

    const RecipeItem: React.FC<{ recipe: CombinedRecipe; level: number }> = ({ recipe, level }) => {
        const [isExpanded, setIsExpanded] = React.useState(false);

        React.useEffect(() => {
            setIsExpanded(allExpanded);
        }, [allExpanded]);

        return (
            <div>
                <div>
                    <div>
                        {recipe.subRecipes && recipe.subRecipes.length > 0 && (
                            <button onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? '▼' : '▶'}
                            </button>
                        )}
                        <h3>{recipe.name}</h3>
                        <span>
                            価格: {recipe.price} / コスト: {recipe.cost}
                        </span>
                    </div>
                    <div>
                        直接材料:{' '}
                        {recipe.materials.map((material, i) => (
                            <span key={i}>
                                {material.name} ×{material.quantity}
                                {i < recipe.materials.length - 1 ? '、' : ''}
                            </span>
                        ))}
                    </div>
                    {level === 0 && recipe.totalMaterials && (
                        <div>
                            必要な全材料:{' '}
                            {recipe.totalMaterials.map((material, i) => (
                                <span key={i}>
                                    {material.name} ×{material.quantity}
                                    {i < recipe.totalMaterials.length - 1 ? '、' : ''}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {recipe.subRecipes && recipe.subRecipes.length > 0 && isExpanded && (
                    <div>
                        {recipe.subRecipes.map((subRecipe, index) => (
                            <RecipeItem key={index} recipe={subRecipe} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <h1>ネルケのアトリエ レシピデータ</h1>
            <div>
                <div>
                    <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                    <button onClick={() => setAllExpanded(!allExpanded)}>
                        {allExpanded ? '全て閉じる' : '全て開く'}
                    </button>
                </div>
                <div>
                    {filteredRecipes.map((recipe, index) => (
                        <RecipeItem key={index} recipe={recipe} level={0} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
