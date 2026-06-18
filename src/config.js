export const GAME_CONFIG = {
    STORAGE_KEY: 'islandGameData',
    STORAGE_VERSION: 3,
    AUTO_SAVE_INTERVAL: 5000,
    GRID_SIZE: 50,
    PLAYER_SIZE: 35,
    PLAYER_SPEED: 5,
    COLLECTION_RANGE: 60,
    RESOURCE_REFRESH_INTERVAL: 30000,
    INVASION_COOLDOWN: 30000,
    INVASION_WARNING_TIME: 5000,
    TRAINING_DURATION: 3000,
    SAIL_DURATION: 10000,
    GOLD_PRODUCTION_INTERVAL: 1000,
    CLOSEST_BUILDING_DISTANCE: 10,
    BUILDING_SPACING: 10
};

export const RESOURCE_INFO = {
    wood: { name: '木材', emoji: '🪵', category: 'materials' },
    stone: { name: '石头', emoji: '🪨', category: 'materials' },
    ore: { name: '矿石', emoji: '💎', category: 'materials' },
    apple: { name: '苹果', emoji: '🍎', category: 'fruits' },
    pear: { name: '梨子', emoji: '🍐', category: 'fruits' },
    treeSeed: { name: '树木种子', emoji: '🌱', category: 'seeds' },
    fruitSeed: { name: '水果种子', emoji: '🍑', category: 'seeds' },
    wheatSeed: { name: '小麦种子', emoji: '🌾', category: 'seeds' },
    carrotSeed: { name: '胡萝卜种子', emoji: '🥕', category: 'seeds' },
    tomatoSeed: { name: '番茄种子', emoji: '🍅', category: 'seeds' },
    cornSeed: { name: '玉米种子', emoji: '🌽', category: 'seeds' },
    wheatHarvest: { name: '小麦', emoji: '🌾', category: 'harvests' },
    carrotHarvest: { name: '胡萝卜', emoji: '🥕', category: 'harvests' },
    tomatoHarvest: { name: '番茄', emoji: '🍅', category: 'harvests' },
    cornHarvest: { name: '玉米', emoji: '🌽', category: 'harvests' },
    water: { name: '淡水', emoji: '💧', category: 'supplies' },
    gold: { name: '金币', emoji: '💰', category: 'currency' }
};

export const RESOURCE_CATEGORIES = {
    materials: { name: '材料', items: ['wood', 'stone', 'ore'] },
    fruits: { name: '水果', items: ['apple', 'pear'] },
    seeds: { name: '种子', items: ['treeSeed', 'fruitSeed', 'wheatSeed', 'carrotSeed', 'tomatoSeed', 'cornSeed'] },
    harvests: { name: '收获', items: ['wheatHarvest', 'carrotHarvest', 'tomatoHarvest', 'cornHarvest'] },
    supplies: { name: '补给', items: ['water'] },
    currency: { name: '货币', items: ['gold'] },
    food: { name: '食物', items: ['wheatHarvest', 'carrotHarvest', 'tomatoHarvest', 'cornHarvest'] }
};

export const INITIAL_RESOURCES = {
    wood: 400,
    stone: 400,
    ore: 400,
    apple: 400,
    pear: 400,
    treeSeed: 400,
    fruitSeed: 400,
    wheatSeed: 400,
    carrotSeed: 400,
    tomatoSeed: 400,
    cornSeed: 400,
    wheatHarvest: 400,
    carrotHarvest: 400,
    tomatoHarvest: 400,
    cornHarvest: 400,
    water: 400,
    gold: 400
};

export const CROP_TYPES = {
    wheat: { name: '小麦', emoji: '🌾', growthTime: 10000, yield: 3, seedCost: { wheatSeed: 1 } },
    carrot: { name: '胡萝卜', emoji: '🥕', growthTime: 8000, yield: 2, seedCost: { carrotSeed: 1 } },
    tomato: { name: '番茄', emoji: '🍅', growthTime: 12000, yield: 4, seedCost: { tomatoSeed: 1 } },
    corn: { name: '玉米', emoji: '🌽', growthTime: 15000, yield: 3, seedCost: { cornSeed: 1 } }
};

export const BUILDING_TYPES = {
    residence: {
        name: '民居',
        emoji: '🏠',
        cost: { wood: 30 },
        size: 50,
        goldPerSecond: 1,
        health: 150,
        maxHealth: 150
    },
    storageHouse: {
        name: '储物屋',
        emoji: '🏠',
        cost: { wood: 25 },
        size: 45,
        storageBonus: 100,
        health: 120,
        maxHealth: 120
    },
    house: {
        name: '房屋',
        emoji: '🏠',
        cost: { wood: 50, stone: 20 },
        size: 60,
        health: 200,
        maxHealth: 200
    },
    hut: {
        name: '小屋',
        emoji: '🏚️',
        cost: { wood: 30, stone: 10 },
        size: 45,
        health: 100,
        maxHealth: 100
    },
    storage: {
        name: '仓库',
        emoji: '📦',
        cost: { wood: 40, stone: 30 },
        size: 50,
        health: 250,
        maxHealth: 250
    },
    farm: {
        name: '农田',
        emoji: '🌾',
        cost: { wood: 20, stone: 5 },
        size: 55,
        health: 80,
        maxHealth: 80
    },
    fishing: {
        name: '捕鱼站',
        emoji: '🎣',
        cost: { wood: 25, stone: 15 },
        size: 40,
        health: 100,
        maxHealth: 100
    },
    campfire: {
        name: '篝火',
        emoji: '🔥',
        cost: { wood: 15 },
        size: 35,
        health: 60,
        maxHealth: 60
    },
    well: {
        name: '水井',
        emoji: '⛏️',
        cost: { wood: 20, stone: 25 },
        size: 45,
        health: 180,
        maxHealth: 180
    },
    machineGun: {
        name: '堡垒炮塔',
        emoji: '🏰',
        cost: { wood: 40, stone: 35 },
        size: 50,
        health: 300,
        maxHealth: 300,
        isTurret: true,
        attackRange: 200,
        attackDamage: 20,
        attackInterval: 0.25,
        refund: { wood: 20, stone: 17 }
    },
    catapult: {
        name: '投石炮塔',
        emoji: '🪨',
        cost: { wood: 60, stone: 50 },
        size: 40,
        health: 250,
        maxHealth: 250,
        isTurret: true,
        attackRange: 280,
        attackDamage: 50,
        attackInterval: 1.8,
        refund: { wood: 30, stone: 25 }
    },
    dock: {
        name: '码头',
        emoji: '⛵',
        cost: { wood: 80, stone: 40 },
        size: 80,
        health: 200,
        maxHealth: 200,
        isDock: true
    },
    barracks: {
        name: '兵营',
        emoji: '🏰',
        cost: { wood: 60, stone: 45 },
        size: 60,
        health: 250,
        maxHealth: 250,
        isBarracks: true,
        requires: ['house', 'hut', 'residence']
    }
};

export const TURRET_CONFIGS = {
    machineGun: {
        name: '堡垒炮塔',
        emoji: '🏰',
        size: 50,
        health: 300,
        attackRange: 200,
        attackDamage: 20,
        attackInterval: 0.25,
        projectileSpeed: 12,
        projectileColor: '#ff6b35',
        projectileSize: 6,
        bulletSpread: 0,
        refund: { wood: 20, stone: 17 }
    },
    catapult: {
        name: '投石炮塔',
        emoji: '🪨',
        size: 40,
        health: 250,
        attackRange: 280,
        attackDamage: 50,
        attackInterval: 1.8,
        projectileSpeed: 5,
        projectileColor: '#8b7355',
        projectileSize: 10,
        bulletSpread: 0,
        refund: { wood: 30, stone: 25 }
    }
};

export const SHIP_TYPES = {
    smallShip: {
        name: '小型船',
        emoji: '⛵',
        cost: { wood: 50, ore: 20 },
        capacity: 5,
        speed: 1,
        cargoSpace: 50
    },
    largeShip: {
        name: '大型船',
        emoji: '🚢',
        cost: { wood: 120, ore: 50, gold: 50 },
        capacity: 15,
        speed: 0.7,
        cargoSpace: 150
    },
    warShip: {
        name: '战船',
        emoji: '⚓',
        cost: { wood: 100, ore: 80, gold: 80 },
        capacity: 10,
        speed: 0.8,
        cargoSpace: 80,
        defense: 50
    }
};

export const DESTINATIONS = {
    home: {
        name: '家园',
        emoji: '🏠',
        distance: 0,
        resources: []
    },
    nearbyIsland: {
        name: '近岛',
        emoji: '🏝️',
        distance: 1,
        resources: ['wood', 'stone', 'apple']
    },
    resourceIsland: {
        name: '资源岛',
        emoji: '⛰️',
        distance: 2,
        resources: ['ore', 'gold', 'pear']
    },
    enemyIsland: {
        name: '敌岛',
        emoji: '🏴‍☠️',
        distance: 3,
        resources: ['gold', 'ore', 'fruitSeed'],
        requiresSoldiers: true,
        dangerLevel: 'high'
    },
    treasureIsland: {
        name: '宝藏岛',
        emoji: '💎',
        distance: 4,
        resources: ['gold', 'ore'],
        requiresSoldiers: true,
        dangerLevel: 'extreme'
    }
};

export const FOOD_CONSUMPTION_PER_SAIL = {
    nearbyIsland: 10,
    resourceIsland: 20,
    enemyIsland: 30,
    treasureIsland: 40
};

export const SOLDIER_INFO = {
    infantry: {
        name: '步兵',
        emoji: '⚔️',
        description: '基础近战单位，攻防均衡',
        attack: 10,
        defense: 8,
        health: 100
    },
    archer: {
        name: '弓箭手',
        emoji: '🏹',
        description: '远程攻击单位，攻击力高',
        attack: 15,
        defense: 4,
        health: 60
    }
};

export const TRAINING_COSTS = {
    infantry: { gold: 20, wheatHarvest: 10 },
    archer: { gold: 35, wheatHarvest: 15 }
};

export const ENEMY_CONFIG = {
    baseHealth: 100,
    baseDamage: 8,
    baseSpeed: 1.5,
    attackInterval: 0.5,
    attackRange: 45,
    killReward: 10
};

export const RESOURCE_TYPES = {
    bigTree: {
        emoji: '🌳',
        name: '大树',
        resourceKey: 'wood',
        amount: 8,
        color: '#1e4d2b',
        spawnChance: 0.12
    },
    smallTree: {
        emoji: '🌲',
        name: '小树',
        resourceKey: 'wood',
        amount: 4,
        color: '#2d5a27',
        spawnChance: 0.2
    },
    stonePile: {
        emoji: '🪨',
        name: '石堆',
        resourceKey: 'stone',
        amount: 3,
        color: '#5a5a5a',
        spawnChance: 0.2,
        secondaryResource: { key: 'ore', amount: 1, chance: 0.3 }
    },
    farmland: {
        emoji: '🌾',
        name: '耕地',
        resourceKey: 'apple',
        amount: 3,
        color: '#8b4513',
        spawnChance: 0.15,
        alternateResource: { key: 'pear', amount: 3, chance: 0.5 }
    },
    treeSeed: {
        emoji: '🌱',
        name: '树木种子',
        resourceKey: 'treeSeed',
        amount: 1,
        color: '#4ade80',
        spawnChance: 0.08
    },
    fruitSeed: {
        emoji: '🍑',
        name: '水果种子',
        resourceKey: 'fruitSeed',
        amount: 1,
        color: '#fb923c',
        spawnChance: 0.05
    },
    wheatSeed: {
        emoji: '🌾',
        name: '小麦种子',
        resourceKey: 'wheatSeed',
        amount: 1,
        color: '#f4d03f',
        spawnChance: 0.05
    },
    carrotSeed: {
        emoji: '🥕',
        name: '胡萝卜种子',
        resourceKey: 'carrotSeed',
        amount: 1,
        color: '#e67e22',
        spawnChance: 0.05
    },
    tomatoSeed: {
        emoji: '🍅',
        name: '番茄种子',
        resourceKey: 'tomatoSeed',
        amount: 1,
        color: '#e74c3c',
        spawnChance: 0.05
    },
    cornSeed: {
        emoji: '🌽',
        name: '玉米种子',
        resourceKey: 'cornSeed',
        amount: 1,
        color: '#f39c12',
        spawnChance: 0.05
    }
};

export const FARM_GRID_CONFIG = {
    gridSize: 4,
    plotSize: 25,
    plotGap: 3
};

export const BATTLE_CONFIG = {
    attackInterval: 1000,
    damageAnimationDuration: 500
};

export const ENEMY_TURRET_CONFIGS = {
    machineGun: { emoji: '🏰', name: '堡垒炮塔', health: 150, maxHealth: 150, damage: 15, attackInterval: 1500 },
    catapult: { emoji: '🪨', name: '投石炮塔', health: 200, maxHealth: 200, damage: 30, attackInterval: 2500 },
    cannon: { emoji: '💥', name: '加农炮', health: 250, maxHealth: 250, damage: 45, attackInterval: 3000 }
};
