addLayer("r", {
    name: "rebirth", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "R", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
		buyable11Unlocked: false,
		upgrade15Unlocked: false,
    }},
    color: "#d35202",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "tokens", // Name of prestige currency
    baseResource: "ticks", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        let mult = new Decimal(1)
        if (hasUpgrade('r', 13)) mult = mult.times(upgradeEffect('r', 13))
        if (player['b'] && player['b'].points) {
            mult = mult.times(buyableEffect('b', 11))
        }
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "r", description: "Rebirths: You can rebirth for tokens!", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
    update() {
        if (player['r'].points.gte(10)) {
            player['r'].buyable11Unlocked = true
            player['r'].upgrade15Unlocked = true
        }
        if (hasUpgrade('r', 15)) {
            let owned = getBuyableAmount('r', 11)
            let cost = new Decimal(4).pow(owned)
            if (player['r'].points.gte(cost)) {
                player['r'].points = player['r'].points.sub(cost)
                setBuyableAmount('r', 11, owned.add(1))
            }
        }
    },

        upgrades: { 11: { title: "The first upgrade",
             description: "Boost ticks by 2x.",
            cost: new Decimal(1),
            },
            12: { title: "The unfirst upgrade",
            description: "Boost ticks by tokens (very creative i know).",
            cost: new Decimal(2),
            effect() {
                return player[this.layer].points.add(1).pow(0.5)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect also hi
            },
            13: { title: "Isn't that how that works already?",
            description: "Boost tokens by ticks.",
            cost: new Decimal(5),
            effect() {
                return player.points.add(1).pow(0.15)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, // Add formatting to the effect also hi
            },
            14: { title: "The big time",
            description: "Boost ticks by 3x.",
            cost: new Decimal(10),
            },
            15: { title: "Sweet automation",
            description: "Automatically buy the Tripler whenever you can.",
            cost: new Decimal(50),
            unlocked() { return player[this.layer].upgrade15Unlocked },
            },
    },
    buyables: {
    11: {
        title: "Tripler",
        unlocked() { return player[this.layer].buyable11Unlocked },
        cost(x) { 
            return new Decimal(4).pow(x) 
        },
        effect(x) { return new Decimal(3).pow(x) },
        effectDisplay() { return format(this.effect(getBuyableAmount(this.layer, this.id))) + "x" },
        display() { 
            let owned = getBuyableAmount(this.layer, this.id)
            let cost = this.cost(owned)
            return `Cost: ${format(cost)}<br>Effect: Multiply ticks by ${format(this.effect(owned))}x<br>Owned: ${owned}`
        },
        canAfford() { 
            let owned = getBuyableAmount(this.layer, this.id)
            return player[this.layer].points.gte(this.cost(owned)) 
        },
        buy() {
            let owned = getBuyableAmount(this.layer, this.id)
            let cost = this.cost(owned)
            player[this.layer].points = player[this.layer].points.sub(cost)
            setBuyableAmount(this.layer, this.id, owned.add(1))
        },
    },
}
})

addLayer("b", {
    name: "reboot",
    symbol: "B",
    position: 0,
    startData() { return {
        unlocked: false,
        points: new Decimal(0),
        rebootUnlocked: false,
    }},
    color: "#4169e1",
    requires: new Decimal(100000000), // 100 million
    resource: "points",
    baseResource: "ticks",
    baseAmount() { return player.points },
    type: "normal",
    exponent: 0.5,
    gainMult() {
        return new Decimal(1)
    },
    gainExp() {
        return new Decimal(1)
    },
    row: 1,
    update() {
        if (player.points.gte(100000000)) player['b'].rebootUnlocked = true
    },
    layerShown() { return player['b'].rebootUnlocked },
    getResetGain() {
        if (player.points.lt(100000000)) return new Decimal(0)
        let gain = player.points.div(100000000).pow(0.5).times(5)
        return gain.floor()
    },
    buyables: {
        11: {
            title: "Token Doubler",
            cost(x) {
                if (x.lt(2)) return new Decimal(2).mul(new Decimal(3).pow(x))
                else return new Decimal(6).mul(new Decimal(5).pow(x.sub(1)))
            },
            effect(x) {
                return new Decimal(2).pow(x)
            },
            effectDisplay() {
                return format(this.effect(getBuyableAmount(this.layer, this.id))) + "x"
            },
            display() {
                let owned = getBuyableAmount(this.layer, this.id)
                let cost = this.cost(owned)
                return `Cost: ${format(cost)}<br>Effect: Multiply tokens by ${format(this.effect(owned))}x<br>Owned: ${owned}`
            },
            canAfford() {
                let owned = getBuyableAmount(this.layer, this.id)
                return player[this.layer].points.gte(this.cost(owned))
            },
            buy() {
                let owned = getBuyableAmount(this.layer, this.id)
                let cost = this.cost(owned)
                player[this.layer].points = player[this.layer].points.sub(cost)
                setBuyableAmount(this.layer, this.id, owned.add(1))
            },
        },
    },
    upgrades: {
        11: {
            title: "Token Generator",
            description: "Gain 0.1% of tokens per second.",
            cost: new Decimal(1e10),
            effect() {
                return getPointGen().times(0.001)
            },
            effectDisplay() {
                return format(this.effect()) + " tokens/sec"
            },
        },
    },
    update() {
        if (hasUpgrade('b', 11)) {
            let tokenGain = getResetGain('r').div(1000)
            player['r'].points = player['r'].points.add(tokenGain)
        }
    },
})