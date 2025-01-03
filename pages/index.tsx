import type { NextPage } from 'next';
import React from 'react';
import { Recipe, recipes } from './data/recipe';
import { PiMoney, PiTrolleyFill } from 'react-icons/pi';

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
        const isParent: boolean = level === 0;
        const [isExpanded, setIsExpanded] = React.useState(false);

        React.useEffect(() => {
            setIsExpanded(allExpanded);
        }, [allExpanded]);

        React.useEffect(() => {
            setIsExpanded(!isParent);
        }, []);

        return (
            <div className={`pt-1 pl-2 ml-${level * 2} ${isParent && 'pb-2 border-b-2 border-[#cdad72]'}`}>
                <div>
                    <div className="flex justify-start">
                        <h3 className="grow">
                            {isParent && recipe.subRecipes && recipe.subRecipes.length > 0 ? (
                                <button onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? '-' : '+'} {recipe.name}
                                </button>
                            ) : (
                                recipe.name
                            )}
                        </h3>
                        {isParent && (
                            <>
                                <p className="w-20 text-sm">
                                    <PiMoney className="inline" />
                                    &nbsp;{recipe.price}
                                </p>
                                <p className="w-12 text-sm">
                                    <PiTrolleyFill className="inline" />
                                    &nbsp;{recipe.cost}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="ml-2">
                        {recipe.materials.map((material, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <p>{material.name}</p>
                                <p>{material.quantity}</p>
                            </div>
                        ))}
                    </div>
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
            <nav className="container fixed top-0 left-0 right-0 bg-[#5a3c18] px-2 py-2 drop-shadow">
                <div className="flex">
                    <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="rounded p-1 flex-auto"
                    />
                    <button
                        onClick={() => setAllExpanded(!allExpanded)}
                        className="rounded p-1 ml-2 w-64 text-white"
                    >
                        {allExpanded ? '-' : '+'}
                    </button>
                </div>
            </nav>
            <div className="container max-w-screen-sm mt-10">
                {filteredRecipes.map((recipe, index) => (
                    <RecipeItem key={index} recipe={recipe} level={0} />
                ))}
            </div>
        </div>
    );
};

export default Home;
