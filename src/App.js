import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import CSVReader from 'react-csv-reader';

import './App.css';

function App() {
    const WooCommerce = new WooCommerceRestApi({
        url: 'https://shop.monaplace.net/',
        consumerKey: 'ck_065753e06187cfd3eb2ff63bba1fad2291a84128',
        consumerSecret: 'cs_4cac6aa609fdf9cf8455bf14832052adbf6eea2c',
        version: 'wc/v3',
    });

    let productData;
    let variationData = {};
    let deleteProductItem = [];
    let dataCsv;
    let idIndex;
    let nameIndex;
    let typeIndex;
    let regular_priceIndex;
    let descriptionIndex;
    let shortDescIndex;
    let imageIndex;
    let parentIndex;
    let attributeValueIndex;
    let attributeNameIndex;
    const handleReadingCsv = (data) => {
        dataCsv = data;
        idIndex = dataCsv[0].indexOf('ID');
        nameIndex = dataCsv[0].indexOf('Name');
        typeIndex = dataCsv[0].indexOf('Type');
        regular_priceIndex = dataCsv[0].indexOf('Regular price');
        descriptionIndex = dataCsv[0].indexOf('Description');
        shortDescIndex = dataCsv[0].indexOf('Short description');
        imageIndex = dataCsv[0].indexOf('Images');
        parentIndex = dataCsv[0].indexOf('Parent');
        attributeValueIndex = dataCsv[0].indexOf('Attribute 1 value(s)');
        attributeNameIndex = dataCsv[0].indexOf('Attribute 1 name');
    };
    let arrayImageUrls = [];
    let productItemData = {};
    let createData = [];
    let parrentData = [];
    variationData = {};

    const variableImport = () => {
        dataCsv.forEach((item, index) => {
            if (item[nameIndex] !== undefined && item[nameIndex] !== 'Name') {
                let imageUrls = item[imageIndex].split(',' || ' ' || ', ');

                imageUrls.forEach((item) => {
                    const objectSrcUrl = {
                        src: item,
                    };
                    arrayImageUrls.push(objectSrcUrl);
                });

                //import từng dòng, nếu variable thì lưu lại id hoặc sku để làm cha, import xong variable thì lấy lại id đã import lưu vào biến,
                // khi import variation thì check id parent ở trong object parent lớn, nếu trùng thì trả lại id sản phẩm đã import trong woo, import attribute
                //import từng dòng
                if (item[typeIndex] === 'variable') {
                    productItemData.Itemid = item[idIndex];
                    productItemData.name = item[nameIndex];
                    productItemData.type = item[typeIndex];
                    productItemData.regular_price = item[regular_priceIndex];
                    productItemData.description = item[descriptionIndex];
                    productItemData.short_description = item[shortDescIndex];
                    productItemData.categories = [{ id: 114 }];
                    productItemData.images = arrayImageUrls;

                    createData = [productItemData];
                    productData = {
                        create: createData,
                    };
                    WooCommerce.post('products/batch', productData)
                        .then((response) => {
                            console.log(response.data);
                            console.log('product CSV ID', productItemData.Itemid);
                            console.log('product Woo ID', response.data.create[0].id);

                            //import vô object chứa các id parent
                            parrentData.push({ csvID: productItemData.Itemid, wooId: response.data.create[0].id });
                            //import vô mảng để xóa sản phẩm
                            deleteProductItem.push(response.data.create[0].id);
                        })
                        .catch((error) => {
                            console.log(error.response.data);
                        });
                }
            }
        });
    };
    const variationImport = () => {
        dataCsv.forEach((item) => {
            if (item[typeIndex] === 'variation') {
                variationData.regular_price = item[regular_priceIndex];
                variationData.attributes = [{ id: 3, option: item[attributeValueIndex] }];

                parrentData.forEach((parrentDataItem) => {
                    if (parrentDataItem.csvID === item[parentIndex].replace('id:', '')) {
                        console.log('đã bắn request post Parrent', `products/${parrentDataItem.wooId}/variations`);
                        console.log(variationData);
                        WooCommerce.post(`products/${parrentDataItem.wooId}/variations`, variationData)
                            .then((response) => {
                                console.log(response.data);
                            })
                            .catch((error) => {
                                console.log(error.response.data);
                            });
                    }
                });
            }
        });
    };
    const handleImport = () => {
        console.log(productData);
    };
    const handleDelete = () => {
        const deleteProductData = {
            delete: deleteProductItem,
        };

        console.log(deleteProductData);
        WooCommerce.post('products/batch', deleteProductData)
            .then((response) => {
                console.log('Thành công: đã xóa sản phẩm', response.data.delete[0].name);
            })
            .catch((error) => {
                console.log(error.response.data);
            });
    };
    const testDataImport = () => {
        const data = {
            name: 'Ship Your Idea',
            type: 'variable',
            regular_price: '24.54',
            description:
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.',
            short_description:
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',

            images: [
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_4_front.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_4_back.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_3_front.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_3_back.jpg',
                },
            ],
            attributes: [
                {
                    id: 2,
                    visible: true,
                    variation: true,
                    options: ['Black', 'Green'],
                },
                {
                    name: 'Size',
                    visible: true,
                    variation: true,
                    options: ['S', 'M'],
                },
            ],
            default_attributes: [
                {
                    id: 2,
                    option: 'Black',
                },
                {
                    name: 'Size',
                    option: 'S',
                },
            ],
        };

        WooCommerce.post('products', data)
            .then((response) => {
                console.log(response.data);
            })
            .catch((error) => {
                console.log(error.response.data);
            });
    };
    return (
        <div className="App">
            <CSVReader onFileLoaded={(data, fileInfo, originalFile) => handleReadingCsv(data)} />
            <button onClick={handleImport}>Import Sản phẩm</button>
            <button onClick={handleDelete}>Xóa Sản phẩm vừa import</button>
            <button onClick={variableImport}>Import Variable</button>
            <button onClick={variationImport}>Import variation</button>
            <button onClick={testDataImport}>Import test data</button>
        </div>
    );
}

export default App;
