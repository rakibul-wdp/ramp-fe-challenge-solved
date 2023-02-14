import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Employee, Transaction } from "./utils/types"
import { InputSelect } from "./components/InputSelect"
import { TransactionPane } from "./components/TransactionPane"
import { Instructions } from "./components/Instructions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"


export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()

  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])
  // created a function to compare all employee id's and then created another array to compare the employee ids to the first and return if they are equal or not
  const compareEmployees = (transactionsByEmployee : Transaction[] | null ) => {
    const result = transactionsByEmployee
    const idMap = result?.map((transaction) => {
      return transaction.employee.id
    })
    const allEqual = (array: string[] | undefined) => array?.every( value => value === array[0] )
    return allEqual(idMap)
  }
 
  
  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          // if there are no employees set it to true otherwise return the loading state as false
          isLoading={!employees ? true : false}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            //checking the employee id & empty employee is set to ""
            // we want to make sure it gets to all transactions
            if (newValue !== null && newValue.id === '') {
              return await loadAllTransactions()
            }
            await loadTransactionsByEmployee(newValue?.id ?? '')
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          {transactions === null ? (
            <div className="RampLoading--container">Loading...</div>
          ) : (
            <Fragment>
              <div data-testid="transaction-container">
                {transactions.map((transaction) => (
                  <TransactionPane key={transaction.id} transaction={transaction} />
                ))}
              </div>
              <button
                className="RampButton"
                // disabled={true}  
                disabled={compareEmployees(transactionsByEmployee) ? true : false}
                onClick={async () => {
                  await loadAllTransactions()
                }}
              >
                View More
              </button>
            </Fragment>
          )}
        </div>
      </main>
    </Fragment>
  )
}
