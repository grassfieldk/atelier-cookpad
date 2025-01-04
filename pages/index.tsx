import type { NextPage } from 'next';
import React from 'react';
import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi';
import { PiMoney, PiStarDuotone, PiStarFill, PiTrolleyFill } from 'react-icons/pi';
import { Recipe, recipes } from '../data/recipe';

interface CombinedRecipe {
    category: string;
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
    const [allExpanded] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [favorites, setFavorites] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        const saved = localStorage.getItem('favorites');
        if (saved) {
            setFavorites(new Set(JSON.parse(saved)));
        }
    }, []);

    // かな/カナの正規化
    const normalizeKana = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[ぁ-ん]/g, (m) => String.fromCharCode(m.charCodeAt(0) + 0x60))
            .replace(/[ァ-ン]/g, (m) => m);
    };

    // レシピに含まれる全材料の計算
    const calculateTotalMaterials = React.useCallback((recipe: CombinedRecipe): Material[] => {
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
    }, []);

    // レシピ名からレシピを再帰的に検索
    const findRecipeByName = React.useCallback(
        (
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
                category: filteredRecipes[0].category || 'default',
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
        },
        [calculateTotalMaterials]
    );

    // お気に入りの保存
    const toggleFavorite = (recipeName: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(recipeName)) {
                next.delete(recipeName);
            } else {
                next.add(recipeName);
            }
            localStorage.setItem('favorites', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const categories = React.useMemo(() => {
        const uniqueCategories = new Set(recipes.map((recipe) => recipe.category));
        return ['all', 'favorites', ...Array.from(uniqueCategories)];
    }, []);

    const filteredRecipes = React.useMemo(() => {
        return recipes
            .filter((recipe) => {
                const nameMatch = normalizeKana(recipe.name).includes(normalizeKana(filterText));
                const categoryMatch =
                    selectedCategory === 'all'
                        ? true
                        : selectedCategory === 'favorites'
                          ? favorites.has(recipe.name)
                          : recipe.category === selectedCategory;
                return nameMatch && categoryMatch;
            })
            .map((recipe) => recipe.name)
            .filter((value, index, self) => self.indexOf(value) === index)
            .map((recipeName) => findRecipeByName(recipeName, recipes))
            .filter((r): r is CombinedRecipe => r !== null);
    }, [filterText, selectedCategory, favorites, findRecipeByName]);

    const RecipeItem: React.FC<{ recipe: CombinedRecipe; level: number }> = ({ recipe, level }) => {
        const isParent: boolean = level === 0;
        const [isExpanded, setIsExpanded] = React.useState(false);

        React.useEffect(() => {
            if (allExpanded) {
                setIsExpanded(true);
            } else {
                setIsExpanded(!isParent);
            }
        }, [isParent]);

        React.useEffect(() => {
            setIsExpanded(!isParent);
        }, [isParent, setIsExpanded]);

        return (
            <div
                className={`pt-1 px-2 ml-${level * 2} ${isParent && 'pb-2 border-b-2 border-[#cdad72]'}`}
            >
                <div>
                    <div className="flex justify-start">
                        <h3 className="grow flex items-center gap-2">
                            <button onClick={() => toggleFavorite(recipe.name)} className="text-xl">
                                {favorites.has(recipe.name) ? (
                                    <PiStarFill className="inline" />
                                ) : (
                                    <PiStarDuotone className="inline" />
                                )}
                            </button>
                            {isParent && recipe.subRecipes && recipe.subRecipes.length > 0 ? (
                                <button onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? (
                                        <BiCollapseVertical className="inline" />
                                    ) : (
                                        <BiExpandVertical className="inline" />
                                    )}{' '}
                                    {recipe.name}
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
                                <p className="text-[#2f1717c0]">{material.name}</p>
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
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="rounded p-1 flex-auto"
                            placeholder="レシピ名を入力"
                        />
                        {/* <button
                            onClick={() => setAllExpanded(!allExpanded)}
                            className="rounded p-1 ml-2 w-24 text-white hover:bg-[#6a4c28]"
                        >
                            {allExpanded ? '全て閉じる' : '全て開く'}
                        </button> */}
                    </div>
                    <div className="flex justify-stretch">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`w-full py-1 text-sm ring-1 ring-[#ffffff60]
                                    ${
                                        selectedCategory === category
                                            ? 'bg-[#8a6c48] text-white'
                                            : 'bg-[#ffffff40] text-white hover:bg-[#ffffff60]'
                                    }
                                    ${category === 'all' && 'rounded-l'}
                                    ${category === '薬' && 'rounded-r'}
                                `}
                            >
                                {category === 'all' ? (
                                    'ALL'
                                ) : category === 'favorites' ? (
                                    <PiStarFill className="inline" />
                                ) : (
                                    category
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
            <div className="container max-w-screen-sm mt-[84px]">
                {filteredRecipes.map((recipe, index) => (
                    <RecipeItem key={index} recipe={recipe} level={0} />
                ))}
            </div>
        </div>
    );
};

export default Home;
