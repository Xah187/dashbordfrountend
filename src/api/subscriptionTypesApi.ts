/**
 * API لإدارة أنواع الاشتراكات (التسعيرات)
 * 
 * يدعم:
 * - جلب أنواع الاشتراكات
 * - إضافة نوع اشتراك جديد
 * - تعديل نوع اشتراك
 * - حذف نوع اشتراك
 */

import apiClient from './config';

// واجهة نوع الاشتراك
export interface SubscriptionType {
    id?: number;
    name: string;
    duration_in_months: number;
    price_per_project: number;
    discraption: string;
}

// جلب جميع أنواع الاشتراكات
export const fetchSubscriptionTypes = async (): Promise<SubscriptionType[]> => {
    try {
        const response = await apiClient.get('/subScription/get_subscription_types');
        console.log('📦 Subscription types response:', response.data);

        if (Array.isArray(response.data)) {
            return response.data;
        }
        if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        if (response.data?.subscriptionTypes && Array.isArray(response.data.subscriptionTypes)) {
            return response.data.subscriptionTypes;
        }

        return [];
    } catch (error: any) {
        console.error('❌ Error fetching subscription types:', error);
        throw error;
    }
};

// إضافة نوع اشتراك جديد
export const insertSubscriptionType = async (data: Omit<SubscriptionType, 'id'>): Promise<any> => {
    try {
        const response = await apiClient.post('/subScription/insert_subscription_types', {
            name: data.name,
            duration_in_months: data.duration_in_months,
            price_per_project: data.price_per_project,
            discraption: data.discraption || ''
        });
        console.log('✅ Insert subscription type response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error inserting subscription type:', error);
        throw error;
    }
};

// تعديل نوع اشتراك
export const updateSubscriptionType = async (data: SubscriptionType): Promise<any> => {
    try {
        const response = await apiClient.put('/subScription/opreation_update_subscription', {
            id: data.id,
            name: data.name,
            duration_in_months: data.duration_in_months,
            price_per_project: data.price_per_project,
            discraption: data.discraption || ''
        });
        console.log('✅ Update subscription type response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error updating subscription type:', error);
        throw error;
    }
};

// حذف نوع اشتراك
export const deleteSubscriptionType = async (id: number): Promise<any> => {
    try {
        const response = await apiClient.delete(`/subScription/Delete_subscription_types`, {
            params: { id }
        });
        console.log('✅ Delete subscription type response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error deleting subscription type:', error);
        throw error;
    }
};
