import React from 'react';
import { Item } from './ListaPedidosModal';
import { formatDate } from '../utils/dateUtils';
import { format } from 'date-fns';

const PrintButton: React.FC<{ item: Item }> = ({ item }) => {
  const handlePrint = async () => {
    const confirmationUrl = `${window.location.origin}/confirmar-status/${item.id}`;
    const pedido = item.pedidos?.[0];
    const dataEmissao = formatDate(pedido?.dataEmissao);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita pop-ups para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${item.name || 'Item'} - Detalhes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .item-title { font-size: 24px; margin: 0; }
            .item-code { color: #555; font-size: 18px; margin: 5px 0 15px; }
            .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-bottom: 10px; }
            .pending { background-color: #fff3cd; color: #856404; }
            .completed { background-color: #d4edda; color: #155724; }
            .details-container { margin: 20px 0; }
            .detail-row { display: flex; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; }
            .detail-label { font-weight: bold; min-width: 150px; color: #555; }
            .detail-value { flex: 1; }
            .qr-container { text-align: center; margin: 30px 0; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
            #qrcode { display: inline-block; margin: 0 auto; }
            #qrcode img { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 class="item-title">${item.name || 'Item sem nome'}</h1>
            <div class="item-code">${item.subname || 'Sem código'}</div>
            <div class="status-badge ${
              item.status === 'CONCLUIDO' ? 'completed' : 'pending'
            }">
              Status: ${item.status === 'CONCLUIDO' ? 'Concluído' : 'Pendente'}
            </div>
          </div>
          <div class="details-container">
            <h3>Informações do Item</h3>
            <div class="detail-row">
              <div class="detail-label">ID:</div>
              <div class="detail-value">${item.id}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Data de Criação:</div>
              <div class="detail-value">${formatDate(item.createdAt)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Data de Emissão:</div>
                <div class="detail-value">${dataEmissao}</div>
              </div>
            ${
              pedido
                ? `
              <div class="detail-row">
                <div class="detail-label">Cliente:</div>
                <div class="detail-value">${
                  pedido.cliente || 'Não informado'
                }</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Quantidade:</div>
                <div class="detail-value">${
                  pedido.quantidade || 'Não informado'
                }</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Material:</div>
                <div class="detail-value">${
                  pedido.material || 'Não informado'
                }</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Operação:</div>
                <div class="detail-value">${
                  pedido.operacao || 'Não informado'
                }</div>
              </div>
              
              ${
                pedido.description
                  ? `<div class="detail-row"><div class="detail-label">Descrição:</div><div class="detail-value">${pedido.description}</div></div>`
                  : ''
              }
              ${
                pedido.observacao
                  ? `<div class="detail-row"><div class="detail-label">Observações:</div><div class="detail-value">${pedido.observacao}</div></div>`
                  : ''
              }
            `
                : ''
            }
            
          </div>
          <div class="qr-container">
            <h3>Confirmar Conclusão</h3>
            <div id="qrcode"></div>
            <p>Escaneie este QR code para confirmar a conclusão deste item</p>
          </div>
          <div class="footer">
            Impresso em ${format(new Date(), 'dd/MM/yyyy')} às ${format(
      new Date(),
      'HH:mm:ss'
    )}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              var qr = qrcode(0, 'M');
              qr.addData("${confirmationUrl}");
              qr.make();
              var svg = qr.createSvgTag(4);
              document.getElementById("qrcode").innerHTML = svg;
              setTimeout(function() { window.print(); }, 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button onClick={handlePrint} className="print-button">
      <i className="icon-print">🖨️</i> Imprimir com QR Code
    </button>
  );
};

export default PrintButton;
