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
    gainMult() {
        let mult = new Decimal(1)
        // Token Doubler effect with Dark Dimensions boost
        let tokendoublerAmount = getBuyableAmount('b', 11)
        if (tokendoublerAmount.gt(0)) {
            let boost = new Decimal(1)
            if (hasUpgrade('b', 16)) {
                boost = new Decimal(1).add(player['b'].darkDimensions)
            }
            mult = mult.times(new Decimal(2).pow(tokendoublerAmount.times(boost)))
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
    doReset(resettingLayer) {
        if (resettingLayer == "b" && hasUpgrade('b', 12)) {
            // Keep upgrades when resetting to reboot
            let keptUpgrades = []
            for (let upgrade in player['r'].upgrades) {
                keptUpgrades.push(upgrade)
            }
            player['r'].upgrades = keptUpgrades
        }
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
        darkDimensions: new Decimal(0),
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
        if (hasUpgrade('b', 16)) {
            let pointsLog = player.points.log10()
            let gain = pointsLog.sub(729).div(100)
            if (gain.gt(0)) {
                player['b'].darkDimensions = player['b'].darkDimensions.add(gain)
            }
        }
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
                else if (x.lt(300)) return new Decimal(6).mul(new Decimal(5).pow(x.sub(1)))
                else if (x.lt(500)) {
                    let basePrice = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298)))
                    return basePrice.mul(new Decimal(10).pow(x.sub(300)))
                } else {
                    let basePrice = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298))).mul(new Decimal(10).pow(new Decimal(200)))
                    return basePrice.mul(new Decimal(1000).pow(x.sub(500)))
                }
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
        12: {
            title: "Ode to automation",
            description: "Keep rebirth upgrades on reboot.",
            cost: new Decimal("1e50"),
        },
        13: {
            title: "That other upgrade is better now",
            description: "Automatically buy the Tripler in the rebirth layer.",
            cost: new Decimal("1e100"),
        },
        14: {
            title: "Getting real close to infinity...",
            description: "Generate 1% of points you would get on reboot reset.",
            cost: new Decimal("1e200"),
        },
        15: {
            title: "No reset???",
            description: "Automatically max out the Token Doubler.",
            cost: new Decimal("1e400"),
        },
        16: {
            title: "Ooh a new feature!",
            description: "Unlock Dark Dimensions, which boosts Token Doubler.",
            cost: new Decimal("1e730"),
        },
    },
    update() {
    if (hasUpgrade('b', 16)) {
            let gain = new Decimal(0)
            if (player.points.gte(1e730)) {
                gain = player.points.log10().sub(729).div(100)
            }
            player['b'].darkDimensions = gain
        }
        if (hasUpgrade('b', 11)) {
            let tokenGain = getResetGain('r').div(1000)
            player['r'].points = player['r'].points.add(tokenGain)
        }
        if (hasUpgrade('b', 13)) {
            let owned = getBuyableAmount('r', 11)
            let cost = new Decimal(4).pow(owned)
            while (player['r'].points.gte(cost)) {
                player['r'].points = player['r'].points.sub(cost)
                owned = owned.add(1)
                setBuyableAmount('r', 11, owned)
                cost = new Decimal(4).pow(owned)
            }
        }
        if (hasUpgrade('b', 14)) {
            let pointGain = getResetGain('b').div(100)
            player['b'].points = player['b'].points.add(pointGain)
        }
        if (hasUpgrade('b', 15)) {
            let owned = getBuyableAmount('b', 11)
            let cost
            if (owned.lt(2)) cost = new Decimal(2).mul(new Decimal(3).pow(owned))
            else if (owned.lt(300)) cost = new Decimal(6).mul(new Decimal(5).pow(owned.sub(1)))
            else if (owned.lt(500)) cost = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298))).mul(new Decimal(10).pow(owned.sub(300)))
            else cost = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298))).mul(new Decimal(10).pow(new Decimal(200))).mul(new Decimal(1000).pow(owned.sub(500)))
            
            while (player['b'].points.gte(cost)) {
                player['b'].points = player['b'].points.sub(cost)
                owned = owned.add(1)
                setBuyableAmount('b', 11, owned)
                
                if (owned.lt(2)) cost = new Decimal(2).mul(new Decimal(3).pow(owned))
                else if (owned.lt(300)) cost = new Decimal(6).mul(new Decimal(5).pow(owned.sub(1)))
                else if (owned.lt(500)) cost = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298))).mul(new Decimal(10).pow(owned.sub(300)))
                else cost = new Decimal(6).mul(new Decimal(5).pow(new Decimal(298))).mul(new Decimal(10).pow(new Decimal(200))).mul(new Decimal(1000).pow(owned.sub(500)))
            }
        }
        if (hasUpgrade('b', 12)) {
            let rebirthUpgrades = [11, 12, 13, 14, 15]
            for (let upgrade of rebirthUpgrades) {
                if (!hasUpgrade('r', upgrade)) {
                    let cost = layers['r'].upgrades[upgrade].cost
                    if (player['r'].points.gte(cost)) {
                        player['r'].points = player['r'].points.sub(cost)
                        addUpgrade('r', upgrade)
                    }
                }
            }
        }
    },
})