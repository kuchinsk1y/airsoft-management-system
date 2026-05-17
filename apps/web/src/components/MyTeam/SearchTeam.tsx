'use client'

import { Search } from 'lucide-react'
import React from 'react'

export default function SearchTeam({
  value,
  onChange,
  onSubmit,
  isDisabled,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isDisabled?: boolean
}) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
      className='flex items-center border border-[#FFFFFF] pl-2.5 itesem-stretch'
    >
      <Search className='text-[#FFFFFF] mx-2.5' />
      <input
        type='text'
        name='searchQuery'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='ВВЕДІТЬ НАЗВУ КОМАНДИ...'
        className='w-full bg-transparent px-5 py-2.5 text-white placeholder:text-white placeholder:opacity-40 focus:outline-none border-r border-[#FFFFFF]'
      />
      <button
        type='submit'
        disabled={isDisabled}
        className='text-white uppercase text-sm font-semibold px-7 w-28.5 min991:w-45 disabled:opacity-50 disabled:pointer-events-none'
      >
        ПЕРЕЙТИ
      </button>
    </form>
  )
}
