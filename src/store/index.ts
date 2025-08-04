import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
// تم حذف projectsReducer
import usersReducer from './slices/usersSlice';
import notificationsReducer from './slices/notificationsSlice';
import companiesReducer from './slices/companiesSlice';
import databaseReducer from './slices/databaseSlice';

// استخدام شرائح وهمية مؤقتة للشرائح غير المنفذة بعد
// سيتم استبدالها بالتنفيذ الفعلي عند الانتهاء من تطويرها
// إنشاء نوع للإجراء (Action)
type AnyAction = {
  type: string;
  [key: string]: any;
};

const createTempReducer = (name: string) => ({
  reducer: (state = { name }, action: AnyAction) => state
});

// إنشاء مخفضات وهمية للشرائح المتبقية التي لم يتم تنفيذها بعد
const settingsReducer = createTempReducer('settings').reducer;
const templatesReducer = createTempReducer('templates').reducer;
const uiReducer = createTempReducer('ui').reducer;
const activityLogsReducer = createTempReducer('activityLogs').reducer;

export const store = configureStore({
  reducer: {
    auth: authReducer,


    users: usersReducer,
    notifications: notificationsReducer,
    settings: settingsReducer,
    companies: companiesReducer,
    database: databaseReducer,
    templates: templatesReducer,
    ui: uiReducer,
    activityLogs: activityLogsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // حالات يمكن تجاهلها للقيم غير القابلة للتسلسل
        ignoredActions: ['auth/login/fulfilled'],
        ignoredPaths: ['auth.userData.lastLoginDate'],
      },
    }),
});

// استخراج أنواع RootState و AppDispatch من متجر
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// هوكات مخصصة لاستخدام التطبيع
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
