import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { IconGripVertical, IconUser } from '@tabler/icons-react'
import { STATUS_OS, STATUS_CORES } from '../data/mock'
import Badge from './ui/Badge'

export default function Kanban({ ordens, onStatusChange, onCardClick }) {
  function handleDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    onStatusChange(draggableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_OS.map((status) => {
          const cor = STATUS_CORES[status]
          const cards = ordens.filter((o) => o.status === status)
          return (
            <div key={status} className="w-72 shrink-0">
              <div className={`flex items-center justify-between rounded-t-card px-3 py-2 ${cor.bg}`}>
                <span className={`text-body font-semibold ${cor.text}`}>{status}</span>
                <span className={`text-label font-bold ${cor.text} bg-white/60 rounded-full px-2`}>{cards.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-2 p-2 min-h-[120px] rounded-b-card border border-t-0 border-muted-dark ${
                      snapshot.isDraggingOver ? 'bg-primary-light' : 'bg-muted'
                    }`}
                  >
                    {cards.map((ordem, index) => (
                      <Draggable key={ordem.id} draggableId={ordem.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => onCardClick(ordem)}
                            className={`bg-surface rounded-card border border-muted-dark p-3 shadow-card hover:shadow-cardHover cursor-pointer ${
                              dragSnapshot.isDragging ? 'shadow-cardHover ring-2 ring-primary' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <Badge>{ordem.id}</Badge>
                              <span {...dragProvided.dragHandleProps} onClick={(e) => e.stopPropagation()} className="text-gray-300 hover:text-gray-500">
                                <IconGripVertical size={16} />
                              </span>
                            </div>
                            <p className="text-body font-semibold text-[#1a1a1a] truncate">{ordem.clienteNome}</p>
                            <p className="text-label text-[#666] flex items-center gap-1 mt-0.5">
                              <IconUser size={13} /> {ordem.tecnicoNome ?? 'Sem técnico'}
                            </p>
                            <p className="text-label text-[#666] mt-0.5">{ordem.tipoServico}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-label text-[#999]">{ordem.dataAgendada}</span>
                              <span className="text-body font-bold text-primary">R$ {ordem.valor}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
