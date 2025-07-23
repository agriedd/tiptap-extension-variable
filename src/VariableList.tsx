
import React, { KeyboardEvent, useEffect, useImperativeHandle, useMemo, useState } from 'react'

export const VariableList = (props: Readonly<{
	query: string,
	command: (e: any)=>void,
	ref: any
}>) => {
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [items, setItems] = useState([
		{label: "List 1", value: "{{ list.pertama }}"},
		{label: "List 2", value: "{{ list.kedua }}"},
	])
	const itemsFiltered = useMemo(()=>{
		return items
			.filter(item => item.label.toLowerCase().startsWith(props.query.trim().toLowerCase()))
			.slice(0, 5) ?? []
	}, [props.query, items])

	const selectItem = (index: number) => {
		const item = itemsFiltered[index]

		if (item) {
			props.command({ id: item.value, label: item.label })
		}
	}

	const upHandler = () => {
		setSelectedIndex((selectedIndex + itemsFiltered.length - 1) % itemsFiltered.length)
	}

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % itemsFiltered.length)
	}

	const enterHandler = () => {
		selectItem(selectedIndex)
	}

	useEffect(() => setSelectedIndex(0), [itemsFiltered])

	useImperativeHandle(props.ref, () => ({
		onKeyDown: ({ event }: { event: KeyboardEvent }) => {
			if (event.key === 'ArrowUp') {
				upHandler()
				return true
			}

			if (event.key === 'ArrowDown') {
				downHandler()
				return true
			}

			if (event.key === 'Enter') {
				enterHandler()
				return true
			}

			return false
		},
	}))

	return (
		<div className="dropdown-menu rounded-lg flex gap-1 flex-col p-1 bg-white">
			{itemsFiltered.length ? (
				itemsFiltered.map((item, index) => (
					<button
						className={
							index === selectedIndex ? 'bg-slate-500 text-white' : ''
						}
						key={index}
						onClick={() => selectItem(index)}
					>
						{item.label}
					</button>
				))
			) : (
				<div className="item">No result</div>
			)}
		</div>
	)
}
