"use client"
import React from 'react'
import { Provider } from 'react-redux'
import { reduxStore } from './index'

const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
    return <>
        <Provider store={reduxStore}>
            {children}
        </Provider>
    </>
}

export default ReduxProvider