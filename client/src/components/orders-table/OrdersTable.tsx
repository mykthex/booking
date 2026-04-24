import { useState } from "react";
import type {
  GraphQLOrder,
} from "../../lib/graphql/.generatedTypes";

interface CourtTableProps {
  orders: GraphQLOrder[];
}

export const OrdersTable: React.FC<CourtTableProps> = ({
  orders,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const tableRows = [
    "orderId",
    "description",
    "amount",
    "type",
    "status",
    "created",
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
        </span>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              {tableRows.map((row, key) => (
                <th key={key}>{row}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, rowIndex) => {
              const globalRowIndex = startIndex + rowIndex + 1;
              return (
                <tr key={order.id || rowIndex}>
                  <th>{globalRowIndex}</th>
                  <td>
                    <span title={order.id || undefined}>
                      {order.id?.substring(0, 4)}...
                    </span>
                  </td>
                  <td>{order.description}</td>
                  <td>{order.amount}$ ({order.currency})</td>
                  <td>{order.type}</td>
                  <td>{order.status}</td>
                  <td>{order.created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="join">
            <button 
              className="join-item btn" 
              onClick={goToPrevious}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn ${page === currentPage ? 'btn-active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="join-item btn" 
              onClick={goToNext}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
