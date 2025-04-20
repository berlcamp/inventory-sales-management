import { configureStore } from '@reduxjs/toolkit'
import listReducer from './listSlice'
import stocksReducer from './stocksSlice'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    user: userReducer,
    stocksList: stocksReducer
  }
})

// Infer the `RootState` type from the store
export type RootState = ReturnType<typeof store.getState>

// You can also export the `AppDispatch` type
export type AppDispatch = typeof store.dispatch
