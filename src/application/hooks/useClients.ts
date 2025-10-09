import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Client } from '@/data/centralData';
import { APP_EVENTS } from '@/events/bus';
import { getClientRepository } from '@/application/services/serviceRegistry';
import { useRepository } from '@/application/services/RepositoryProvider';

export const useClients = () => {
  const repository = useRepository(getClientRepository);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  const syncClients = useCallback(async () => {
    const list = await repository.getAll();
    if (isMountedRef.current) {
      setClients(list);
    }
    return list;
  }, [repository]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    syncClients()
      .catch((error) => {
        console.error('تعذر تحميل بيانات العملاء', error);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [syncClients]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler: EventListener = () => {
      syncClients().catch((error) => {
        console.debug('تعذر مزامنة قائمة العملاء بعد حدث التحديث', error);
      });
    };
    window.addEventListener(APP_EVENTS.CLIENTS_UPDATED, handler);
    return () => {
      window.removeEventListener(APP_EVENTS.CLIENTS_UPDATED, handler);
    };
  }, [syncClients]);

  const addClient = useCallback(async (newClient: Omit<Client, 'id'>) => {
    try {
      const created = await repository.create(newClient);
      await syncClients();
      toast.success('تم حفظ العميل بنجاح!');
      return created;
    } catch (error) {
      console.error('حدث خطأ أثناء إضافة عميل جديد', error);
      toast.error('فشل في حفظ البيانات');
      throw error;
    }
  }, [repository, syncClients]);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      const updated = await repository.update(updatedClient.id, updatedClient);
      if (!updated) {
        throw new Error('العميل غير موجود');
      }
      await syncClients();
      toast.success('تم تحديث العميل بنجاح!');
      return updated;
    } catch (error) {
      console.error('حدث خطأ أثناء تحديث بيانات العميل', error);
      toast.error('فشل في حفظ البيانات');
      throw error;
    }
  }, [repository, syncClients]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      await repository.delete(clientId);
      await syncClients();
      toast.success('تم حذف العميل بنجاح.');
    } catch (error) {
      console.error('حدث خطأ أثناء حذف العميل', error);
      toast.error('فشل في حذف العميل');
      throw error;
    }
  }, [repository, syncClients]);

  const refreshClients = useCallback(async () => {
    await syncClients();
  }, [syncClients]);

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    refreshClients,
    isLoading,
  };
};
