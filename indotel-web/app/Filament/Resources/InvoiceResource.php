<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InvoiceResource\Pages;
use App\Models\Invoice;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class InvoiceResource extends Resource
{
    protected static ?string $model = Invoice::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationLabel = 'Tagihan';
    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('invoice_number')
                ->label('No. Invoice')
                ->required()
                ->unique(ignoreRecord: true),

            Forms\Components\Select::make('user_id')
                ->label('Pelanggan')
                ->relationship('user', 'name')
                ->searchable()
                ->required(),

            Forms\Components\Select::make('subscription_id')
                ->label('Langganan')
                ->relationship('subscription', 'id')
                ->searchable(),

            Forms\Components\TextInput::make('amount')
                ->label('Jumlah')
                ->numeric()
                ->prefix('Rp')
                ->required(),

            Forms\Components\TextInput::make('period')
                ->label('Periode')
                ->placeholder('Oktober 2025')
                ->required(),

            Forms\Components\DatePicker::make('due_date')->label('Jatuh Tempo')->required(),

            Forms\Components\Select::make('status')
                ->options([
                    'paid' => 'Lunas',
                    'unpaid' => 'Belum Bayar',
                    'overdue' => 'Terlambat',
                    'cancelled' => 'Dibatalkan',
                ])
                ->default('unpaid')
                ->required(),

            Forms\Components\TextInput::make('payment_method')->label('Metode Bayar'),
            Forms\Components\DateTimePicker::make('paid_at')->label('Dibayar Pada'),
            Forms\Components\Textarea::make('notes')->label('Catatan')->rows(3)->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('invoice_number')
                    ->label('No. Invoice')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Pelanggan')
                    ->searchable(),

                Tables\Columns\TextColumn::make('period')->label('Periode'),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Jumlah')
                    ->money('IDR')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'success' => 'paid',
                        'warning' => 'unpaid',
                        'danger' => 'overdue',
                        'gray' => 'cancelled',
                    ])
                    ->formatStateUsing(fn ($state) => [
                        'paid' => 'Lunas',
                        'unpaid' => 'Belum Bayar',
                        'overdue' => 'Terlambat',
                        'cancelled' => 'Dibatalkan',
                    ][$state] ?? $state),

                Tables\Columns\TextColumn::make('due_date')
                    ->label('Jatuh Tempo')
                    ->dateTime('d M Y')
                    ->sortable(),

                Tables\Columns\TextColumn::make('paid_at')
                    ->label('Dibayar')
                    ->dateTime('d M Y')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'paid' => 'Lunas',
                        'unpaid' => 'Belum Bayar',
                        'overdue' => 'Terlambat',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInvoices::route('/'),
            'create' => Pages\CreateInvoice::route('/create'),
            'edit' => Pages\EditInvoice::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::whereIn('status', ['unpaid', 'overdue'])->count();
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
