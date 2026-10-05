/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   return sale_price * quantity * (1 - (discount / 100))
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index > 0 && index < 3) {
        return profit * 0.1;
    } else if (index === (total - 1)) {
        return 0;
    } else {
       return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;

    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    } 
    
    // @TODO: Проверка наличия опций
    if(!data
        || (!Array.isArray(data.sellers) || !Array.isArray(data.purchase_records) || !Array.isArray(data.products) || !Array.isArray(data.customers))
        || (data.sellers.length === 0 || data.purchase_records.length === 0 || data.products.length === 0 || data.customers.length === 0)
    ) throw new Error('Некорректные входные данные');

    // Проверка наличия требуемых функций в опциях
    if((!calculateRevenue || !calculateBonus)
    || (!(typeof calculateRevenue === 'function') || !(typeof calculateBonus === 'function'))
    ) throw new Error('Отсутствуют функции обработки.');

    // @TODO: Подготовка промежуточных данных для сбора статистики

    let sellerStats  = data.sellers.map(seller => {
        return {
                id: seller.id,
                name: `${seller.first_name} ${seller.last_name}`,
                revenue: 0,
                profit: 0,
                sales_count: 0,
            products_sold: {}
        }
    })

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    let sellerIndex = sellerStats .reduce((res, seller) => {
        res[seller.id] = seller
        return res
    }, {})

    let productIndex = data.products.reduce((res, product) => {
        res[product.sku] = product
        return res
    }, {})

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(purchase_record => {
        const seller = sellerIndex[purchase_record.seller_id]
        seller.sales_count++;
        seller.revenue += purchase_record.total_amount;

        purchase_record.items.forEach((purchase_record_item) => {
            const product = productIndex[purchase_record_item.sku];
            const cost = product.purchase_price * purchase_record_item.quantity;
            const revenue = calculateRevenue(purchase_record_item);
            const profit = revenue - cost;

            seller.profit += profit;
            if (!seller.products_sold[purchase_record_item.sku]) 
                seller.products_sold[purchase_record_item.sku] = 0;
            seller.products_sold[purchase_record_item.sku] += purchase_record_item.quantity;
        })
    })

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
        if (a.profit < b.profit) {
            return 1;
        }
        if (a.profit > b.profit) {
            return -1;
        }
        return 0;        
    });

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
            seller.bonus = calculateBonus(index, sellerStats.length, seller);
            const entries = Object.entries(seller.products_sold);
            seller.top_products = entries
                .map(([sku, quantity]) => ({ sku, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);
    });

    console.log(sellerStats);

    // @TODO: Подготовка итоговой коллекции с нужными полями    
    return sellerStats.map(seller => ({
            seller_id: seller.id,
            name: seller.name,
            revenue: seller.revenue,
            profit: seller.profit,
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: seller.bonus
    }));


}
