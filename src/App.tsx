import React from "react";
import { Fragment, useCallback,useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, loading: employeesLoading, fetchAll: fetchAllEmployees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, loading: transactionsLoading, fetchAll: fetchAllTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const [transactionApprovalUpdates, setTransactionApprovalUpdates] = useState({})

  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee(transactionApprovalUpdates, setTransactionApprovalUpdates)
  
  const [isEmployeeFilterApplied, setIsEmployeeFilterApplied] = useState(false);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    await fetchAllEmployees()
    await fetchAllTransactions()

  }, [fetchAllEmployees, fetchAllTransactions, transactionsByEmployeeUtils])

  // const loadTransactionsByEmployee = useCallback(
  //   async (employeeId: string) => {
  //     paginatedTransactionsUtils.invalidateData()
  //     await transactionsByEmployeeUtils.fetchById(employeeId)
  //   },
  //   [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  // )
  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsEmployeeFilterApplied(true);
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )
  
  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions()
    }
  }, [employeesLoading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading} // modified to employeesLoading here
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === '') { // Checking for null or empty string ID
              // Fetch all transactions when "All Employees" is selected
              setIsEmployeeFilterApplied(false);
              setTransactionApprovalUpdates({}); // Clear transaction approval updates
              await loadAllTransactions()
            } else {
              // Fetch transactions for the selected employee
              setTransactionApprovalUpdates({}); // Clear transaction approval updates
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
          
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

           {/* Show 'View More' button only when there's a next page for paginated transactions and not filtering by employee*/}
        {paginatedTransactions?.nextPage !== null && !isEmployeeFilterApplied && (
          <button
            className="RampButton"
            disabled={transactionsLoading} // modified to transactionsLoading here
            onClick={async () => {
              await fetchAllTransactions()
            }}
          >
            View More
          </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}

