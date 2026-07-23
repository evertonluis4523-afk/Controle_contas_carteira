import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addMonths, format, parseISO } from 'date-fns';
import { db, logHistory } from '../database/db';
import { todayISO } from '../utils/format';
import Card from '../components/Card';

const schema = z.object({
  type: z.enum(['receita', 'despesa']),
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  description: z.string().min(1, 'Descreva o lançamento'),
  date: z.string().min(10, 'Data obrigatória'),
  accountId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
  installments: z.coerce.number().min(1).max(48).default(1),
  status: z.enum(['pago', 'pendente']),
  note: z.string().optional()
});
type FormData = z.infer<typeof schema>;

/** Cadastro/edição de receitas e despesas, com parcelamento. */
export default function TransactionForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id') ? Number(params.get('id')) : null;

  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (params.get('tipo') as 'receita' | 'despesa') ?? 'despesa',
      date: todayISO(),
      installments: 1,
      status: 'pago'
    }
  });
  const type = watch('type');

  useEffect(() => {
    if (editId) {
      db.transactions.get(editId).then((tx) => tx && reset({ ...schema.partial().parse(tx), ...tx } as FormData));
    }
  }, [editId, reset]);

  async function onSubmit(data: FormData) {
    if (editId) {
      await db.transactions.update(editId, { ...data });
      await logHistory('edicao', 'Lançamento #' + editId + ' editado: ' + data.description);
    } else if (data.installments > 1 && data.type === 'despesa') {
      const value = data.amount / data.installments;
      const base = parseISO(data.date);
      for (let i = 0; i < data.installments; i++) {
        await db.transactions.add({
          ...data,
          amount: Math.round(value * 100) / 100,
          date: format(addMonths(base, i), 'yyyy-MM-dd'),
          installmentIndex: i + 1,
          status: i === 0 ? data.status : 'pendente'
        });
      }
      await logHistory('inclusao', data.description + ' em ' + data.installments + 'x');
    } else {
      await db.transactions.add({ ...data });
      await logHistory('inclusao', data.type + ': ' + data.description);
    }
    navigate(-1);
  }

  async function remove() {
    if (editId && confirm('Excluir este lançamento?')) {
      await db.transactions.delete(editId);
      await logHistory('exclusao', 'Lançamento #' + editId + ' excluído');
      navigate(-1);
    }
  }

  const filteredCats = categories.filter((c) => c.type === type);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 14 }}>{editId ? 'Editar lançamento' : 'Novo lançamento'}</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <label className={'chip' + (type === 'despesa' ? ' active' : '')} style={{ justifyContent: 'center' }}>
              <input type="radio" value="despesa" {...register('type')} hidden /> Despesa
            </label>
            <label className={'chip' + (type === 'receita' ? ' active' : '')} style={{ justifyContent: 'center' }}>
              <input type="radio" value="receita" {...register('type')} hidden /> Receita
            </label>
          </div>

          <div className="field">
            <label>Valor</label>
            <input type="number" step="0.01" inputMode="decimal" placeholder="0,00" {...register('amount')} />
            {errors.amount && <p className="error">{errors.amount.message}</p>}
          </div>
          <div className="field">
            <label>Descrição</label>
            <input placeholder="Ex.: Mercado da semana" {...register('description')} />
            {errors.description && <p className="error">{errors.description.message}</p>}
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Data</label>
              <input type="date" {...register('date')} />
            </div>
            <div className="field">
              <label>Status</label>
              <select {...register('status')}>
                <option value="pago">Pago / recebido</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Categoria</label>
              <select {...register('categoryId')}>
                <option value="">Selecione</option>
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Conta</label>
              <select {...register('accountId')}>
                <option value="">Selecione</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          {type === 'despesa' && (
            <div className="grid-2">
              <div className="field">
                <label>Forma de pagamento</label>
                <select {...register('paymentMethod')}>
                  <option value="">Selecione</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div className="field">
                <label>Parcelas</label>
                <input type="number" min={1} max={48} {...register('installments')} disabled={!!editId} />
              </div>
            </div>
          )}
          <div className="field">
            <label>Observação</label>
            <textarea rows={2} placeholder="Opcional" {...register('note')} />
          </div>
          <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
            {editId ? 'Salvar alterações' : 'Adicionar'}
          </button>
          {editId && (
            <button type="button" className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={remove}>
              Excluir
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
