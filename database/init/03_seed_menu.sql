-- Demo logins: admin@foodhub.dev/Admin@123, owner@foodhub.dev/Owner@123, demo@foodhub.dev/Demo@123
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Platform Admin', 'admin@foodhub.dev', crypt('Admin@123', gen_salt('bf', 10)), 'admin'),
    ('Riya Kapoor',    'owner@foodhub.dev', crypt('Owner@123', gen_salt('bf', 10)), 'restaurant_owner'),
    ('Demo Customer',  'demo@foodhub.dev',  crypt('Demo@123',  gen_salt('bf', 10)), 'customer');

INSERT INTO categories (name) VALUES
    ('North Indian'), ('Biryani'), ('South Indian'), ('Chinese'), ('Pizza & Pasta'),
    ('Burgers'), ('Healthy'), ('Desserts'), ('Beverages'), ('Street Food');

INSERT INTO restaurants (owner_id, name, description, cuisine, address, image_url, rating, delivery_time_min)
SELECT u.id, v.name, v.description, v.cuisine, v.address, v.image_url, v.rating, v.eta
FROM (VALUES
    ('owner@foodhub.dev', 'Spice Route',    'Tandoor-fired North Indian classics and slow-cooked gravies.',          'North Indian',  '12 MG Road, Bengaluru',          'https://foodish-api.com/images/butter-chicken/butter-chicken1.jpg', 4.5, 35),
    ('owner@foodhub.dev', 'Biryani Bros',   'Hyderabadi dum biryani sealed and slow-cooked the traditional way.',    'Biryani',       '7 Banjara Hills, Hyderabad',     'https://foodish-api.com/images/biryani/biryani2.jpg',               4.6, 40),
    ('owner@foodhub.dev', 'Green Bowl',     'High-protein bowls, salads and juices for clean eating.',               'Healthy',       '44 HSR Layout, Bengaluru',       'https://foodish-api.com/images/rice/rice18.jpg',                    4.7, 25),
    (NULL,                'Dosa Junction',  'Crisp dosas, soft idlis and filter coffee from Udupi recipes.',         'South Indian',  '3 Jayanagar 4th Block, Bengaluru','https://foodish-api.com/images/dosa/dosa2.jpg',                    4.4, 25),
    (NULL,                'Dragon Wok',     'Indo-Chinese wok favourites with plenty of heat.',                      'Chinese',       '21 Koramangala, Bengaluru',      'https://foodish-api.com/images/rice/rice2.jpg',                     4.2, 30),
    (NULL,                'Slice Theory',   'Sourdough pizzas and fresh pasta made to order.',                       'Italian',       '9 Indiranagar, Bengaluru',       'https://foodish-api.com/images/pizza/pizza2.jpg',                   4.3, 35),
    (NULL,                'Burger Foundry', 'Smashed, grilled and crispy burgers with loaded sides.',                'American',      '18 Whitefield, Bengaluru',       'https://foodish-api.com/images/burger/burger2.jpg',                 4.1, 30),
    (NULL,                'Sugar Rush',     'Indian sweets, warm desserts and thick shakes.',                        'Desserts',      '5 Church Street, Bengaluru',     'https://foodish-api.com/images/dessert/dessert1.jpg',               4.5, 20),
    (NULL,                'Chaat Street',   'Mumbai and Delhi street food, tangy and spicy.',                        'Street Food',   '30 Andheri West, Mumbai',        'https://foodish-api.com/images/samosa/samosa2.jpg',                 4.3, 20)
) AS v(owner_email, name, description, cuisine, address, image_url, rating, eta)
LEFT JOIN users u ON u.email = v.owner_email;

INSERT INTO foods (restaurant_id, category_id, name, description, price, rating, is_veg, spice_level, calories, protein_g, tags, image_url)
SELECT r.id, c.id, v.name, v.description, v.price, v.rating, v.is_veg, v.spice_level, v.calories, v.protein_g, v.tags, v.image_url
FROM (VALUES
    -- Spice Route
    ('Spice Route', 'North Indian', 'Paneer Tikka Masala', 'Chargrilled cottage cheese cubes simmered in a smoky tomato-onion gravy finished with kasuri methi and cream.', 289, 4.6, TRUE, 2, 540, 24, ARRAY['paneer','creamy','tandoor','high-protein','curry'], 'https://foodish-api.com/images/butter-chicken/butter-chicken3.jpg'),
    ('Spice Route', 'North Indian', 'Butter Chicken', 'Tandoori chicken tikka in a velvety tomato, butter and cashew sauce. Mild, rich and the house bestseller.', 329, 4.8, FALSE, 1, 610, 38, ARRAY['chicken','creamy','mild','bestseller','curry'], 'https://foodish-api.com/images/butter-chicken/butter-chicken1.jpg'),
    ('Spice Route', 'North Indian', 'Dal Makhani', 'Whole black lentils and kidney beans slow-cooked overnight with butter and cream. Comforting and mildly spiced.', 219, 4.5, TRUE, 1, 420, 16, ARRAY['lentils','comfort-food','creamy','curry'], 'https://foodish-api.com/images/butter-chicken/butter-chicken7.jpg'),
    ('Spice Route', 'North Indian', 'Kadai Chicken', 'Boneless chicken tossed with bell peppers and onions in a fiery, freshly pounded kadai masala.', 309, 4.5, FALSE, 3, 520, 40, ARRAY['chicken','spicy','high-protein','curry'], 'https://foodish-api.com/images/butter-chicken/butter-chicken10.jpg'),
    ('Spice Route', 'North Indian', 'Chole Bhature', 'Punjabi chickpea curry with tangy spices served with two fluffy deep-fried bhature. Very filling.', 189, 4.4, TRUE, 2, 780, 20, ARRAY['chickpeas','punjabi','fried','filling'], 'https://foodish-api.com/images/butter-chicken/butter-chicken14.jpg'),
    ('Spice Route', 'North Indian', 'Jeera Rice', 'Fragrant basmati rice tempered with cumin seeds and ghee. A light, mild side for any curry.', 129, 4.2, TRUE, 0, 330, 6, ARRAY['rice','side','mild'], 'https://foodish-api.com/images/rice/rice3.jpg'),

    -- Biryani Bros
    ('Biryani Bros', 'Biryani', 'Hyderabadi Chicken Dum Biryani', 'Long-grain basmati layered with yogurt-marinated chicken, saffron, mint and fried onions, sealed and dum-cooked.', 299, 4.7, FALSE, 2, 720, 36, ARRAY['biryani','chicken','dum','bestseller','rice'], 'https://foodish-api.com/images/biryani/biryani1.jpg'),
    ('Biryani Bros', 'Biryani', 'Mutton Dum Biryani', 'Tender goat meat slow-cooked with aged basmati, whole spices and ghee. Rich and aromatic.', 389, 4.6, FALSE, 2, 810, 42, ARRAY['biryani','mutton','rich','high-protein','rice'], 'https://foodish-api.com/images/biryani/biryani5.jpg'),
    ('Biryani Bros', 'Biryani', 'Veg Dum Biryani', 'Seasonal vegetables and paneer layered with saffron basmati and caramelised onions.', 229, 4.2, TRUE, 2, 560, 14, ARRAY['biryani','vegetarian','paneer','rice'], 'https://foodish-api.com/images/biryani/biryani9.jpg'),
    ('Biryani Bros', 'Biryani', 'Egg Biryani', 'Boiled eggs roasted in masala and layered into fragrant biryani rice. Great value.', 219, 4.3, FALSE, 2, 620, 24, ARRAY['biryani','egg','budget','rice'], 'https://foodish-api.com/images/biryani/biryani12.jpg'),
    ('Biryani Bros', 'Biryani', 'Chicken 65', 'Crispy, red-hot deep-fried chicken bites tempered with curry leaves and green chillies.', 249, 4.5, FALSE, 3, 480, 32, ARRAY['chicken','starter','spicy','fried','high-protein'], 'https://foodish-api.com/images/butter-chicken/butter-chicken12.jpg'),
    ('Biryani Bros', 'Biryani', 'Mirchi Ka Salan', 'Long green chillies in a tangy peanut, sesame and tamarind gravy. The classic biryani side.', 149, 4.1, TRUE, 3, 260, 6, ARRAY['side','spicy','gravy','vegan'], 'https://foodish-api.com/images/butter-chicken/butter-chicken15.jpg'),

    -- Green Bowl
    ('Green Bowl', 'Healthy', 'Grilled Chicken Protein Bowl', 'Herb-grilled chicken breast over brown rice with broccoli, chickpeas and tahini dressing. Post-workout favourite.', 349, 4.7, FALSE, 0, 520, 45, ARRAY['high-protein','bowl','lean','healthy','gym','chicken'], 'https://foodish-api.com/images/rice/rice17.jpg'),
    ('Green Bowl', 'Healthy', 'Quinoa Paneer Power Bowl', 'Tandoori paneer, tri-colour quinoa, roasted veggies and mint yogurt. Vegetarian and gluten-free.', 329, 4.6, TRUE, 1, 480, 28, ARRAY['high-protein','quinoa','paneer','healthy','gluten-free','bowl'], 'https://foodish-api.com/images/rice/rice20.jpg'),
    ('Green Bowl', 'Healthy', 'Tofu Teriyaki Bowl', 'Pan-seared tofu glazed in teriyaki with edamame, sesame greens and jasmine rice. Fully vegan.', 299, 4.4, TRUE, 1, 450, 22, ARRAY['vegan','tofu','healthy','bowl'], 'https://foodish-api.com/images/rice/rice22.jpg'),
    ('Green Bowl', 'Healthy', 'Greek Salad', 'Cucumber, cherry tomato, olives, red onion and feta with oregano vinaigrette. Light and low-carb.', 249, 4.3, TRUE, 0, 280, 9, ARRAY['salad','low-calorie','low-carb','fresh','keto'], NULL),
    ('Green Bowl', 'Healthy', 'Sprouts Chaat Salad', 'Moong sprouts, pomegranate, onion and lemon with chaat masala. Tangy, vegan and under 250 calories.', 179, 4.2, TRUE, 1, 220, 13, ARRAY['salad','low-calorie','vegan','tangy'], NULL),
    ('Green Bowl', 'Healthy', 'Egg White Omelette Wrap', 'Fluffy egg-white omelette with spinach and peppers in a whole-wheat wrap. Lean breakfast protein.', 199, 4.1, FALSE, 0, 340, 30, ARRAY['eggs','high-protein','breakfast','wrap','lean'], NULL),
    ('Green Bowl', 'Beverages', 'Cold-Pressed Green Juice', 'Spinach, cucumber, green apple and ginger, cold-pressed with nothing added.', 149, 4.3, TRUE, 0, 120, 2, ARRAY['beverage','detox','vegan','low-calorie','juice'], NULL),

    -- Dosa Junction
    ('Dosa Junction', 'South Indian', 'Masala Dosa', 'Crisp fermented rice-lentil crepe with spiced potato filling, served with sambar and coconut chutney.', 139, 4.6, TRUE, 1, 420, 9, ARRAY['dosa','breakfast','crispy','bestseller'], 'https://foodish-api.com/images/dosa/dosa1.jpg'),
    ('Dosa Junction', 'South Indian', 'Mysore Masala Dosa', 'Dosa smeared with fiery red garlic-chilli chutney and filled with potato masala.', 159, 4.5, TRUE, 2, 450, 10, ARRAY['dosa','spicy','crispy'], 'https://foodish-api.com/images/dosa/dosa5.jpg'),
    ('Dosa Junction', 'South Indian', 'Paneer Dosa', 'Golden dosa stuffed with spiced crumbled paneer and onions.', 179, 4.3, TRUE, 1, 480, 18, ARRAY['dosa','paneer','protein'], 'https://foodish-api.com/images/dosa/dosa12.jpg'),
    ('Dosa Junction', 'South Indian', 'Idli Sambar', 'Four soft steamed rice cakes with sambar and chutney. Light, low-oil and easy on the stomach.', 99, 4.3, TRUE, 1, 260, 8, ARRAY['idli','steamed','light','low-fat','breakfast'], 'https://foodish-api.com/images/idly/idly8.jpg'),
    ('Dosa Junction', 'South Indian', 'Ghee Podi Idli', 'Mini idlis tossed in ghee and spicy gunpowder podi.', 119, 4.4, TRUE, 2, 310, 8, ARRAY['idli','breakfast','spicy'], 'https://foodish-api.com/images/idly/idly3.jpg'),
    ('Dosa Junction', 'Beverages', 'Filter Coffee', 'Strong South Indian decoction coffee with frothy hot milk, served in a dabara.', 59, 4.7, TRUE, 0, 90, 3, ARRAY['beverage','coffee','hot'], NULL),

    -- Dragon Wok
    ('Dragon Wok', 'Chinese', 'Veg Hakka Noodles', 'Wok-tossed noodles with cabbage, carrots, spring onion and soy. Mild and smoky.', 179, 4.2, TRUE, 1, 520, 11, ARRAY['noodles','indo-chinese','wok'], 'https://foodish-api.com/images/pasta/pasta3.jpg'),
    ('Dragon Wok', 'Chinese', 'Chicken Schezwan Fried Rice', 'Fried rice with chicken, egg and fiery Schezwan sauce.', 229, 4.3, FALSE, 3, 610, 26, ARRAY['rice','spicy','schezwan','chicken'], 'https://foodish-api.com/images/rice/rice5.jpg'),
    ('Dragon Wok', 'Chinese', 'Chilli Paneer Dry', 'Crispy paneer cubes tossed with peppers, onions, green chilli and soy-garlic glaze.', 239, 4.4, TRUE, 2, 430, 20, ARRAY['paneer','indo-chinese','starter','spicy'], 'https://foodish-api.com/images/rice/rice8.jpg'),
    ('Dragon Wok', 'Chinese', 'Veg Manchurian Gravy', 'Vegetable dumplings in a garlicky soy-chilli gravy. Pairs with fried rice.', 199, 4.1, TRUE, 2, 410, 8, ARRAY['indo-chinese','gravy'], 'https://foodish-api.com/images/rice/rice10.jpg'),
    ('Dragon Wok', 'Chinese', 'Chilli Garlic Prawns', 'Juicy prawns flash-fried with burnt garlic and red chillies.', 349, 4.5, FALSE, 3, 380, 30, ARRAY['seafood','prawns','spicy','high-protein'], 'https://foodish-api.com/images/rice/rice14.jpg'),
    ('Dragon Wok', 'Chinese', 'Hot and Sour Chicken Soup', 'Peppery, tangy broth with shredded chicken and vegetables. Light and warming.', 129, 4.0, FALSE, 2, 140, 10, ARRAY['soup','light','spicy','low-calorie'], NULL),

    -- Slice Theory
    ('Slice Theory', 'Pizza & Pasta', 'Margherita Pizza', 'San Marzano tomato, fresh mozzarella and basil on a hand-stretched sourdough base.', 299, 4.4, TRUE, 0, 800, 32, ARRAY['pizza','cheese','classic','mild'], 'https://foodish-api.com/images/pizza/pizza1.jpg'),
    ('Slice Theory', 'Pizza & Pasta', 'Farmhouse Pizza', 'Loaded with capsicum, onion, mushroom, sweet corn and olives.', 349, 4.3, TRUE, 0, 860, 30, ARRAY['pizza','vegetables','cheese'], 'https://foodish-api.com/images/pizza/pizza4.jpg'),
    ('Slice Theory', 'Pizza & Pasta', 'Pepperoni Pizza', 'Double pepperoni with mozzarella and oregano. Crisp edges, bestseller.', 399, 4.6, FALSE, 1, 920, 38, ARRAY['pizza','pepperoni','bestseller','cheese'], 'https://foodish-api.com/images/pizza/pizza8.jpg'),
    ('Slice Theory', 'Pizza & Pasta', 'Peri Peri Chicken Pizza', 'Peri peri marinated chicken, red onion and jalapenos on a spicy tomato base.', 429, 4.5, FALSE, 2, 900, 42, ARRAY['pizza','chicken','spicy'], 'https://foodish-api.com/images/pizza/pizza12.jpg'),
    ('Slice Theory', 'Pizza & Pasta', 'Penne Arrabbiata', 'Penne in a fiery garlic-chilli tomato sauce with parsley.', 259, 4.2, TRUE, 2, 610, 16, ARRAY['pasta','italian','spicy','vegan'], 'https://foodish-api.com/images/pasta/pasta5.jpg'),
    ('Slice Theory', 'Pizza & Pasta', 'Creamy Alfredo Pasta', 'Fettuccine in a parmesan cream sauce with mushrooms. Mild and indulgent.', 289, 4.3, TRUE, 0, 720, 20, ARRAY['pasta','creamy','cheese','mild'], 'https://foodish-api.com/images/pasta/pasta9.jpg'),

    -- Burger Foundry
    ('Burger Foundry', 'Burgers', 'Classic Crispy Chicken Burger', 'Buttermilk-fried chicken thigh, slaw and pickles in a toasted brioche bun.', 219, 4.3, FALSE, 1, 640, 30, ARRAY['burger','chicken','fried'], 'https://foodish-api.com/images/burger/burger1.jpg'),
    ('Burger Foundry', 'Burgers', 'Peri Peri Chicken Burger', 'Flame-grilled peri peri chicken with chilli mayo and lettuce.', 239, 4.4, FALSE, 2, 610, 34, ARRAY['burger','chicken','spicy'], 'https://foodish-api.com/images/burger/burger5.jpg'),
    ('Burger Foundry', 'Burgers', 'Grilled Chicken Lean Burger', 'Grilled (not fried) chicken breast on a whole-wheat bun with lettuce and mustard. High protein, lower calorie.', 249, 4.3, FALSE, 0, 430, 36, ARRAY['burger','grilled','high-protein','lean','healthy'], 'https://foodish-api.com/images/burger/burger17.jpg'),
    ('Burger Foundry', 'Burgers', 'Paneer Crunch Burger', 'Crumb-fried paneer slab with tandoori mayo and onions.', 179, 4.2, TRUE, 1, 560, 22, ARRAY['burger','paneer','protein'], 'https://foodish-api.com/images/burger/burger13.jpg'),
    ('Burger Foundry', 'Burgers', 'Aloo Tikki Burger', 'Spiced potato patty with mint mayo and onions. The budget classic.', 99, 4.0, TRUE, 1, 420, 9, ARRAY['burger','budget','vegetarian'], 'https://foodish-api.com/images/burger/burger9.jpg'),
    ('Burger Foundry', 'Burgers', 'Peri Peri Fries', 'Crinkle-cut fries dusted with peri peri seasoning.', 129, 4.2, TRUE, 2, 380, 4, ARRAY['fries','side','spicy','vegan'], NULL),

    -- Sugar Rush
    ('Sugar Rush', 'Desserts', 'Gulab Jamun', 'Two warm khoya dumplings soaked in cardamom-rose sugar syrup.', 89, 4.6, TRUE, 0, 300, 4, ARRAY['dessert','indian-sweet','warm'], 'https://foodish-api.com/images/dessert/dessert2.jpg'),
    ('Sugar Rush', 'Desserts', 'Chocolate Lava Cake', 'Molten-centre dark chocolate cake served warm.', 179, 4.7, TRUE, 0, 450, 6, ARRAY['dessert','chocolate','warm'], 'https://foodish-api.com/images/dessert/dessert5.jpg'),
    ('Sugar Rush', 'Desserts', 'Rasmalai', 'Soft chenna discs in chilled saffron-pistachio milk.', 129, 4.5, TRUE, 0, 280, 7, ARRAY['dessert','indian-sweet','chilled'], 'https://foodish-api.com/images/dessert/dessert8.jpg'),
    ('Sugar Rush', 'Desserts', 'New York Cheesecake', 'Baked vanilla cheesecake on a buttery biscuit base with berry compote.', 219, 4.4, TRUE, 0, 410, 7, ARRAY['dessert','cheesecake','chilled'], 'https://foodish-api.com/images/dessert/dessert11.jpg'),
    ('Sugar Rush', 'Desserts', 'Brownie Sundae', 'Warm fudge brownie with vanilla ice cream and hot chocolate sauce.', 189, 4.5, TRUE, 0, 520, 7, ARRAY['dessert','chocolate','ice-cream'], 'https://foodish-api.com/images/dessert/dessert14.jpg'),
    ('Sugar Rush', 'Beverages', 'Mango Lassi', 'Thick chilled yogurt shake with Alphonso mango pulp.', 99, 4.6, TRUE, 0, 240, 7, ARRAY['beverage','mango','chilled','yogurt'], NULL),
    ('Sugar Rush', 'Beverages', 'Cold Coffee with Ice Cream', 'Blended cold coffee topped with a scoop of vanilla ice cream.', 139, 4.4, TRUE, 0, 330, 8, ARRAY['beverage','coffee','chilled'], NULL),

    -- Chaat Street
    ('Chaat Street', 'Street Food', 'Samosa', 'Two crisp pastry triangles stuffed with spiced potato and peas, with tamarind chutney.', 49, 4.4, TRUE, 2, 310, 5, ARRAY['snack','fried','budget','tea-time'], 'https://foodish-api.com/images/samosa/samosa1.jpg'),
    ('Chaat Street', 'Street Food', 'Samosa Chaat', 'Crushed samosa topped with chole, yogurt, tamarind and mint chutneys and sev.', 99, 4.5, TRUE, 2, 420, 11, ARRAY['chaat','tangy','street-food'], 'https://foodish-api.com/images/samosa/samosa7.jpg'),
    ('Chaat Street', 'Street Food', 'Pani Puri', 'Crisp puris filled with spiced potato and tangy mint-tamarind water.', 69, 4.6, TRUE, 2, 180, 3, ARRAY['chaat','tangy','street-food','vegan'], NULL),
    ('Chaat Street', 'Street Food', 'Pav Bhaji', 'Buttery mashed vegetable curry with toasted pav, Mumbai style.', 139, 4.6, TRUE, 2, 560, 12, ARRAY['street-food','mumbai','buttery'], NULL),
    ('Chaat Street', 'Street Food', 'Vada Pav', 'Spiced potato fritter in a soft bun with garlic and green chutneys.', 49, 4.3, TRUE, 2, 290, 6, ARRAY['street-food','mumbai','budget'], NULL),
    ('Chaat Street', 'Street Food', 'Chicken Kathi Roll', 'Smoky chicken tikka, onions and mint chutney wrapped in a flaky paratha.', 159, 4.4, FALSE, 2, 480, 26, ARRAY['roll','chicken','wrap'], NULL)
) AS v(restaurant, category, name, description, price, rating, is_veg, spice_level, calories, protein_g, tags, image_url)
JOIN restaurants r ON r.name = v.restaurant
JOIN categories  c ON c.name = v.category;
