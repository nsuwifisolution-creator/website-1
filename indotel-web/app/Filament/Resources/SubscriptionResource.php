<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SubscriptionResource\Pages;
use App\Models\Subscription;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SubscriptionResource extends Resource
{
    protected static ?string $model = Subscription::class;
    protected static ?string $navigationIcon = 'heroicon-o-signal';
    protected static ?string $navigationLabel = 'Langganan';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('user_id')
                ->label('Pelanggan')
                ->relationship('user', 'name')
                ->searchable()
                ->preload()
                ->required(),

            Forms\Components\Select::make('package_id')
                ->label('Paket')
                ->relationship('package', 'name')
                ->searchable()
                ->preload()
                ->required(),

            Forms\Components\Select::make('status')
                ->options([
                    'active' => 'Aktif',
                    'suspended' => 'Ditangguhkan',
                    'cancelled' => 'Dibatalkan',
                    'pending' => 'Pending',
                ])
                ->default('active')
                ->required(),

            Forms\Components\DatePicker::make('start_date')->label('Mulai'),
            Forms\Components\DatePicker::make('end_date')->label('Berakhir'),

            Forms\Components\Textarea::make('notes')->label('Catatan')->rows(3)->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('user.name')->label('Pelanggan')->searchable(),
                Tables\Columns\TextColumn::make('package.name')->label('Paket'),
                Tables\Columns\TextColumn::make('package.speed')->label('Kecepatan'),
                Tables\Columns\TextColumn::make('package.price')->label('Harga')->money('IDR'),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'success' => 'active',
                        'warning' => 'suspended',
                        'danger' => 'cancelled',
                        'gray' => 'pending',
                    ]),
                Tables\Columns\TextColumn::make('end_date')->label('Berakhir')->dateTime('d M Y'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active' => 'Aktif',
                        'suspended' => 'Ditangguhkan',
                        'cancelled' => 'Dibatalkan',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSubscriptions::route('/'),
            'create' => Pages\CreateSubscription::route('/create'),
            'edit' => Pages\EditSubscription::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::where('status', 'active')->count();
    }
}
