export interface Point {
  id: number
  text?: string
  subtitle?: string
  marklist?: string[]
  numberlist?: string[]
}

export interface Subsection {
  id: number
  subtitle: string
  points: Point[]
}

export interface Section {
  id: number
  text?: string
  numberlist?: string[]
  marklist?: string[] | string
}

export interface Rule {
  id: number
  title: string
  sections?: Section[]
  subsections?: Subsection[]
}
