// Domain Value Objects - Pure business logic, immutable objects

export class Stats {
  constructor(
    public readonly hp: number,
    public readonly mp: number,
    public readonly str: number,
    public readonly def: number,
    public readonly mag: number,
    public readonly spd: number
  ) {
    if (hp < 0 || mp < 0 || str < 0 || def < 0 || mag < 0 || spd < 0) {
      throw new Error('Stats cannot be negative');
    }
  }

  public add(other: Stats): Stats {
    return new Stats(
      this.hp + other.hp,
      this.mp + other.mp,
      this.str + other.str,
      this.def + other.def,
      this.mag + other.mag,
      this.spd + other.spd
    );
  }

  public multiply(factor: number): Stats {
    return new Stats(
      Math.floor(this.hp * factor),
      Math.floor(this.mp * factor),
      Math.floor(this.str * factor),
      Math.floor(this.def * factor),
      Math.floor(this.mag * factor),
      Math.floor(this.spd * factor)
    );
  }

  public toJSON() {
    return {
      hp: this.hp,
      mp: this.mp,
      str: this.str,
      def: this.def,
      mag: this.mag,
      spd: this.spd
    };
  }
}

export class Experience {
  constructor(
    public readonly current: number,
    public readonly nextLevel: number,
    public readonly total: number
  ) {
    if (current < 0 || nextLevel < 0 || total < 0) {
      throw new Error('Experience values cannot be negative');
    }
    if (current > nextLevel) {
      throw new Error('Current experience cannot exceed next level requirement');
    }
  }

  public add(amount: number): Experience {
    if (amount < 0) {
      throw new Error('Cannot add negative experience');
    }

    const newTotal = this.total + amount;
    const newCurrent = Math.min(this.current + amount, this.nextLevel);

    return new Experience(newCurrent, this.nextLevel, newTotal);
  }

  public isLevelUp(): boolean {
    return this.current >= this.nextLevel;
  }

  public toJSON() {
    return {
      current: this.current,
      nextLevel: this.nextLevel,
      total: this.total
    };
  }
}

export class Reward {
  constructor(
    public readonly gold: number,
    public readonly experience: number,
    public readonly items: Item[] = []
  ) {
    if (gold < 0 || experience < 0) {
      throw new Error('Reward values cannot be negative');
    }
  }

  public combine(other: Reward): Reward {
    return new Reward(
      this.gold + other.gold,
      this.experience + other.experience,
      [...this.items, ...other.items]
    );
  }

  public toJSON() {
    return {
      gold: this.gold,
      experience: this.experience,
      items: this.items.map(item => item.toJSON())
    };
  }
}

export class Item {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly rarity: string,
    public readonly value: number
  ) {
    if (value < 0) {
      throw new Error('Item value cannot be negative');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      rarity: this.rarity,
      value: this.value
    };
  }
}

export class Rule {
  constructor(
    public readonly id: string,
    public readonly priority: number,
    public readonly condition: string,
    public readonly target: string,
    public readonly action: string
  ) {
    if (priority < 0) {
      throw new Error('Rule priority cannot be negative');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      priority: this.priority,
      condition: this.condition,
      target: this.target,
      action: this.action
    };
  }
}