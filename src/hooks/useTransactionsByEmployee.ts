import { useCallback, useState } from "react";
import { RequestByEmployeeParams, Transaction } from "../utils/types";
import { TransactionsByEmployeeResult } from "./types";
import { useCustomFetch } from "./useCustomFetch";

export function useTransactionsByEmployee(
  externalTransactionApprovalUpdates: Record<string, boolean>,
  setExternalTransactionApprovalUpdates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<Transaction[]>([]);
  const [transactionApprovalUpdates, setTransactionApprovalUpdates] = useState<Record<string, boolean>>(externalTransactionApprovalUpdates)

  const fetchById = useCallback(
    async (employeeId: string) => {
      const fetchedTransactions = await fetchWithCache<Transaction[], RequestByEmployeeParams>(
        "transactionsByEmployee",
        { employeeId }
      )
      
      if (fetchedTransactions) {
        const updatedTransactions = fetchedTransactions.map((transaction) => ({
          ...transaction,
          approved: transactionApprovalUpdates?.[transaction.id] ?? transaction.approved
        }))
        setTransactionsByEmployee(updatedTransactions)
      }
      
    },
    [fetchWithCache, transactionApprovalUpdates]
  )

  const updateApprovalStatus = useCallback(
    (transactionId: string, approved: boolean) => {
      setTransactionApprovalUpdates(prevUpdates => ({
        ...prevUpdates,
        [transactionId]: approved,
      }))
      setExternalTransactionApprovalUpdates(prevUpdates => ({
        ...prevUpdates,
        [transactionId]: approved,
      }))
    },
    [setExternalTransactionApprovalUpdates]
  )
  
  const invalidateData = useCallback(() => {
    setTransactionsByEmployee([]) // Clear the transactions by setting it to an empty array
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData, updateApprovalStatus }
}

