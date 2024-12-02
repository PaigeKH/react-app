export interface Dragon {
    acceptaid: boolean | null,
    id: string,
    name: string | null,
    owner: string,
    start: string,
    hatch: string,
    grow: string,
    death: string,
    views: number,
    unique: number,
    clicks: number,
    gender: string,
    hoursleft: string,
    parent_f: Dragon | null,
    parent_m: Dragon | null,
    hp?: number,
    maxHP?: number,
    mp?: number,
    maxMP?: number,
    stamina?: number,
    maxStamina?: number,
    intellect?: number,
    wisdom?: number,
    spirit?: number,
    agility?: number,
    speed?: number,
    strength?: number,
    defense?: number,
    total?: number,
    body?: string,
    ele1?: string,
    ele2?: string,
    breed?: string,
    attacks?: string[],
    registered?: boolean,
  }