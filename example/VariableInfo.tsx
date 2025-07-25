
import React, { KeyboardEvent, useEffect, useImperativeHandle, useMemo, useState } from 'react'

export const VariableInfo = (props: Readonly<{
	query: string,
	id: string,
	label: string,
	command: (e: any)=>void,
	ref: any
}>) => {

	return (
		<div className="dropdown-menu rounded-lg flex gap-1 flex-col p-4 bg-white text-slate-900 max-w-sm
		    w-full min-w-[128px] shadow-lg border border-gray-200">
            <h1>
                { props.label }
            </h1>
            { props.id }
		</div>
	)
}
