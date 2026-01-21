/**
 * Maps food names to custom SVG icon components
 * Comprehensive keyword-based matching system with exact food icon mappings
 */

import {
  BurgerIcon,
  SaladIcon,
  BurritoIcon,
  EggsIcon,
  DairyIcon,
  MeatIcon,
  VegetablesIcon,
  PastaIcon,
  PizzaIcon,
  FruitsIcon,
  BowlsIcon,
  BreadIcon,
  TacoIcon,
  SushiIcon,
  SoupIcon,
  HotDogIcon,
  RamenIcon,
} from '@/src/components/food-icons';

export type FoodIconComponent = React.ComponentType<{ size?: number; color?: string }>;

// Food icon mapping - Priority order: most specific first
const FOOD_ICON_MAP: Array<{ icon: FoodIconComponent; keywords: string[] }> = [
  // Burrito - Specific icon
  {
    icon: BurritoIcon,
    keywords: ['burrito', 'wrap', 'mediterranean wrap', 'breakfast burrito', 'chicken wrap', 'turkey wrap'],
  },
  
  // Taco - Specific icon
  {
    icon: TacoIcon,
    keywords: ['taco', 'tacos', 'hard-shell taco', 'soft taco'],
  },
  
  // Sandwich - Use burger icon
  {
    icon: BurgerIcon,
    keywords: ['sandwich', 'sub', 'submarine', 'hoagie', 'grilled cheese', 'panini', 'club sandwich'],
  },
  
  // Hot Dog - Specific icon
  {
    icon: HotDogIcon,
    keywords: ['hot dog', 'hotdog', 'frankfurter', 'wiener'],
  },
  
  // Burger - Specific icon
  {
    icon: BurgerIcon,
    keywords: ['burger', 'hamburger', 'cheeseburger', 'chicken burger', 'beef burger', 'veggie burger'],
  },
  
  // Pizza - Specific icon
  {
    icon: PizzaIcon,
    keywords: ['pizza', 'margherita', 'pepperoni', 'cheese pizza', 'slice', 'pie', 'pizza slice'],
  },
  
  // Pasta - Specific icon
  {
    icon: PastaIcon,
    keywords: [
      'pasta', 'spaghetti', 'fettuccine', 'penne', 'macaroni', 'lasagna', 'ravioli',
      'primavera', 'alfredo', 'carbonara', 'parmesan', 'chicken parmesan',
      'stir fry', 'stir-fry', 'beef stir fry'
    ],
  },
  
  // Ramen - Specific icon
  {
    icon: RamenIcon,
    keywords: ['ramen', 'noodles', 'udon', 'soba', 'pho', 'pad thai', 'lo mein', 'chow mein', 'rice noodles'],
  },
  
  // Bowls - Specific icon
  {
    icon: BowlsIcon,
    keywords: ['bowl', 'quinoa bowl', 'rice bowl', 'noodle bowl', 'poke bowl', 'buddha bowl', 'grain bowl', 'oatmeal bowl'],
  },
  
  // Soup - Specific icon
  {
    icon: SoupIcon,
    keywords: ['soup', 'miso', 'chicken soup', 'vegetable soup', 'broth', 'stew', 'chili', 'gumbo', 'bisque', 'chowder'],
  },
  
  // Sushi - Specific icon
  {
    icon: SushiIcon,
    keywords: ['sushi', 'sashimi', 'roll', 'maki', 'nigiri', 'tempura', 'sushi roll'],
  },
  
  // Eggs - Specific icon
  {
    icon: EggsIcon,
    keywords: ['egg', 'eggs', 'scrambled', 'fried', 'poached', 'boiled', 'omelet', 'omelette', 'frittata'],
  },
  
  // Chicken - Use meat icon
  {
    icon: MeatIcon,
    keywords: [
      'chicken', 'breast', 'thigh', 'drumstick', 'wings', 'grilled chicken',
      'chicken parmesan', 'chicken breast', 'roasted chicken', 'fried chicken', 'turkey'
    ],
  },
  
  // Fish - Use meat icon (we can add a fish icon later if needed)
  {
    icon: MeatIcon,
    keywords: [
      'salmon', 'fish', 'tuna', 'cod', 'tilapia', 'trout', 'mackerel',
      'teriyaki salmon', 'baked salmon', 'grilled fish', 'sashimi', 'seafood',
      'shrimp', 'crab', 'lobster', 'scallops'
    ],
  },
  
  // Meat - Specific icon
  {
    icon: MeatIcon,
    keywords: [
      'meat', 'beef', 'steak', 'pork', 'bacon', 'sausage', 'ham',
      'meatballs', 'turkey bacon', 'ground beef', 'ribs', 'chop', 'protein', 'tofu'
    ],
  },
  
  // Bread - Specific icon
  {
    icon: BreadIcon,
    keywords: [
      'bread', 'toast', 'bagel', 'muffin', 'croissant', 'roll', 'bun',
      'garlic bread', 'pita bread', 'whole wheat', 'sourdough', 'baguette',
      'pancake', 'pancakes', 'waffle', 'waffles', 'french toast'
    ],
  },
  
  // Vegetables - Specific icon
  {
    icon: VegetablesIcon,
    keywords: [
      'vegetables', 'veggies', 'broccoli', 'carrots', 'asparagus', 'brussels',
      'sprouts', 'spinach', 'kale', 'lettuce', 'sweet potato', 'potato',
      'roasted', 'steamed', 'sautéed', 'stir-fried vegetables', 'mixed vegetables',
      'roasted carrots', 'roasted brussels sprouts', 'steamed broccoli', 'steamed asparagus',
      'sautéed spinach'
    ],
  },
  
  // Salad - Specific icon
  {
    icon: SaladIcon,
    keywords: [
      'salad', 'greens', 'caesar', 'garden salad', 'side salad', 'greek salad',
      'mixed greens', 'kale salad', 'quinoa', 'pickled'
    ],
  },
  
  // Fruits - Specific icon
  {
    icon: FruitsIcon,
    keywords: [
      'banana', 'apple', 'orange', 'berry', 'berries', 'strawberry', 'blueberry',
      'raspberry', 'grape', 'melon', 'watermelon', 'pineapple', 'mango', 'peach',
      'pear', 'kiwi', 'avocado', 'fresh berries', 'fruit', 'fruits'
    ],
  },
  
  // Dairy - Specific icon
  {
    icon: DairyIcon,
    keywords: [
      'milk', 'yogurt', 'greek yogurt', 'cheese', 'dairy', 'cream', 'butter',
      'sour cream', 'cottage cheese', 'mozzarella', 'cheddar'
    ],
  },
  
  // Rice - Use bowls icon
  {
    icon: BowlsIcon,
    keywords: [
      'rice', 'brown rice', 'white rice', 'jasmine rice', 'wild rice',
      'fried rice', 'sticky rice', 'couscous'
    ],
  },
  
  // Breakfast items - Use bowls icon
  {
    icon: BowlsIcon,
    keywords: ['oatmeal', 'porridge', 'cereal', 'granola', 'breakfast'],
  },
  
  // Nuts - Use fruits icon
  {
    icon: FruitsIcon,
    keywords: ['almonds', 'nuts', 'walnuts', 'cashews', 'pecans', 'peanuts', 'pistachios'],
  },
  
  // Sauces/Dips/Condiments - Use salad icon as placeholder
  {
    icon: SaladIcon,
    keywords: [
      'salsa', 'hummus', 'sauce', 'dip', 'tahini', 'guacamole', 'pesto',
      'marinara', 'ranch', 'mayonnaise', 'mustard', 'ketchup', 'bbq', 'dressing',
      'tahini sauce'
    ],
  },
];

/**
 * Get icon component for a food item
 * Uses priority-based keyword matching (first match wins)
 */
export function getFoodIcon(foodName: string): FoodIconComponent {
  const lowerName = foodName.toLowerCase().trim();
  
  // Try each icon mapping in priority order (first match wins)
  for (const { icon, keywords } of FOOD_ICON_MAP) {
    // Check if any keyword matches
    for (const keyword of keywords) {
      // Exact word match with word boundaries for accuracy
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      
      if (wordRegex.test(lowerName)) {
        return icon;
      }
    }
  }
  
  // Default fallback - use restaurant icon (we'll use a generic icon)
  return BowlsIcon;
}
