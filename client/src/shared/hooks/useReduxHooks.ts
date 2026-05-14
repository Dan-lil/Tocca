import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";


// типизированные кастомные хуки для получения информации из хранилища (selector) и отправки действий (dispatch)
export const useAppDispatch = useDispatch<AppDispatch>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;