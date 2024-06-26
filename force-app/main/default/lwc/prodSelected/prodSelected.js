//IMPORTANT this branch is the most up to date branch prior to search tag was used 5/25/2023
//has to be a way to call apex on the new products selected here
import { LightningElement, api, wire, track } from 'lwc';
import getDetailsPricing from '@salesforce/apex/cpqApex.getDetailsPricing';
import getProducts from '@salesforce/apex/cpqApex.getProducts';
import onLoadGetInventory from '@salesforce/apex/cpqApex.onLoadGetInventory';
import onLoadGetLastPaid from '@salesforce/apex/cpqApex.onLoadGetLastPaid';
import onLoadGetLevels from '@salesforce/apex/cpqApex.getLevelPricing';
import onLoadGetLastQuoted from '@salesforce/apex/cpqApex.onLoadGetLastQuoted';
import wareHouses from '@salesforce/apex/quickPriceSearch.getWarehouse';
import inCounts from '@salesforce/apex/cpqApex.inCounts';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe,  unsubscribe} from 'lightning/messageService';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import createProducts from '@salesforce/apex/cpqApex.createProducts';
import {getRecord, getFieldValue, updateRecord, getRecordNotifyChange } from 'lightning/uiRecordApi';
import { deleteRecord} from 'lightning/uiRecordApi';
import ACC from '@salesforce/schema/Opportunity.AccountId';
import STAGE from '@salesforce/schema/Opportunity.StageName';
import PRICE_BOOK from '@salesforce/schema/Opportunity.Pricebook2Id'; 
import WAREHOUSE from '@salesforce/schema/Opportunity.Warehouse__c';
import DELIVERYDATE from '@salesforce/schema/Opportunity.Delivery_Date_s_Requested__c';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import SHIPADD  from '@salesforce/schema/Opportunity.Shipping_Address__c'
import SHIPCHARGE from '@salesforce/schema/Opportunity.Shipping_Total__c';
import SHIPTYPE from '@salesforce/schema/Opportunity.Ship_Type__c';
import DISCOUNT from '@salesforce/schema/Opportunity.Discount_Percentage__c';
import RUP_PROD from '@salesforce/schema/Opportunity.RUP_Selected__c'; 
import {mergeInv,mergeLastPaid, lineTotal, onLoadProducts , newInventory,updateNewProducts, getTotals, getCost,roundNum, allInventory, 
    checkPricing ,getShipping, getManLines, setMargin, mergeLastQuote, roundRate, checkRUP, sortArray,removeLineItem, loadCheck} from 'c/helper'

const FIELDS = [ACC, STAGE, WAREHOUSE];
export default class ProdSelected extends LightningElement {
    @api recordId; 
    pbeId; 
    productId; 
    productCode;
    pbId;
    unitCost;
    unitWeight;
    fPrice; 
    levelOne;
    levelOneMargin; 
    levelTwo;
    levelTwoMargin;
    companyLastPaid;
    palletConfig;
    resUse; 
    sgn;   
    agency;
    sId; 
    productName; 
    prodFound = false
    accountId;
    deliveryDate; 
    shipType;
    dropShip;
    rupSelected; 
    lineDiscount;  
    stage;
    warehouse;
    shippingAddress;
    invCount;
    lastQuote
    error;
    goodPricing = true;   
    hasRendered = true;
    unsavedProducts = false; 
    wasSubmitted; 
    loaded = true;
    goodQty; 
    tPrice = 0.00;
    countOfBadPrice = 0; 
    //shpWeight;
    tQty=0;
    tMargin = 0;
    tCost = 0;
    //hide margin col if non rep is close!
    pryingEyes = false
    numbOfManLine = 0
    eventListening = false; 
    @track selection = [];
    
    //for ordering products on the order. This will be set to the last Line_Order__c # on load or set at 0 on new order;
    lineOrderNumber = 0; 
//for message service
    subscritption = null;

    @wire(MessageContext)
    messageContext;
    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.loaded = false; 
        this.subscribeToMessageChannel();
        this.loadProducts(); 
        
    }
        //get warehouse
        @wire(wareHouses)
        wiredWarehouse({ error, data }) {
            if (data) {
                let back  = data.map((item, index) =>({
                    ...item, 
                    label:item.Name, 
                    value:item.Id
                
                }))
                //back.unshift({label:'All', value:'All'})
                this.warehouseOptions = [...back]; 
                
            } else if (error) {
                this.error = error;
                console.error(this.error)
            }
        } 
    renderedCallback(){
        if(this.selection.length>0 && this.hasRendered){
            let startCheck = loadCheck(this.selection); 
            if(startCheck){
                this.loadProducts(); 
                this.priceCheck();
            }else{
                this.priceCheck();
            }
        }
         
    }
priceCheck(){
    window.clearTimeout(this.delay)
    this.delay = setTimeout(()=>{
        this.initPriceCheck();
    }, 1500)

}
    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
    //subscribe to channel
    subscribeToMessageChannel(){
        if(!this.subscritption){
            this.subscritption = subscribe(
                this.messageContext,
                Opportunity_Builder,
                (message) => this.handleMessage(message),
                {scope:APPLICATION_SCOPE}
            );
        }
    }
    watchKeyDown = (event) => {
        if(event.key === '`'){
            this.saveProducts();
        }
     };

    startEventListener(){
        if(!this.eventListening){
            console.log('listening')
            window.addEventListener('keydown', this.watchKeyDown,{
                once:false,
            }) 
            this.eventListening = true; 
        }

    }
    endEventListener(){
        this.eventListening = false; 
        window.removeEventListener('keydown', this.watchKeyDown);
    }
    handleMessage(mess){
        if(mess.shipAddress){
            //console.log('shipping address');
            
            this.shippingAddress = mess.shipAddress;
        }else if(mess.newDiscount){
            this.loadProducts(); 
        }else{
            //console.log('new product');
            
            this.productCode = mess.productCode;
            let alreadyThere = this.selection.findIndex(prod => prod.ProductCode === this.productCode);
            
            if(alreadyThere<0){
                this.productName = mess.productName;
                this.productId = mess.productId 
                this.pbeId = mess.pbeId;
                this.unitCost = mess.unitCost
                this.unitWeight = mess.prodWeight;
                this.agency = mess.agencyProduct;
                this.fPrice = mess.floorPrice;
                this.levelOne = mess.levelOnePrice;
                this.levelOneMargin = mess.levelOneMargin;
                this.levelTwo = mess.levelTwoPrice;  
                this.levelTwoMargin = mess.levelTwoMargin; 
                this.companyLastPaid = mess.lastPaid
                this.palletConfig = mess.palletQty;
                this.sgn = mess.size; 
                this.resUse = mess.rup;
                this.handleNewProd(); 
                this.prodFound = true;
             }        
            }
        
    }
    unsubscribeToMessageChannel() {   
        unsubscribe(this.subscription);
        this.subscription = null;
    }
//get record values
    @wire(getRecord, {recordId: '$recordId', fields:[ACC, STAGE, PRICE_BOOK, WAREHOUSE, SHIPADD, DELIVERYDATE, SHIPTYPE, DISCOUNT, RUP_PROD]})
        loadFields({data, error}){
            if(data){
                this.accountId = getFieldValue(data, ACC);
                this.stage = getFieldValue(data, STAGE);
                this.pbId = getFieldValue(data, PRICE_BOOK); 
                this.warehouse = getFieldValue(data, WAREHOUSE); 
                this.shippingAddress  = getFieldValue(data, SHIPADD);
                this.deliveryDate = getFieldValue(data, DELIVERYDATE); 
                this.shipType = getFieldValue(data, SHIPTYPE);
                this.lineDiscount = getFieldValue(data, DISCOUNT);
                this.rupSelected = getFieldValue(data, RUP_PROD); 
                this.dropShip = this.shipType === 'DS' ? true : false; 
                this.wasSubmitted = this.stage === 'Closed Won'? true : false;
            }else if(error){
                console.log('error '+JSON.stringify(error));
                
            }
        }
    async handleNewProd(){
        //get last paid only works on new adding product
        let totalPrice;
        let totalQty; 
        let result; 
        try{
            if(this.accountId){
                result = await getDetailsPricing({pId:this.productId , locationId: this.warehouse, accId:this.accountId, 
                                                pc:this.productCode , recId: this.recordId, priceBookId: this.pbId})
            }else{
                result = await getDetailsPricing({pId:this.productId , locationId: this.warehouse, accId: undefined, 
                    pc:this.productCode , recId: this.recordId, priceBookId: this.pbId})
            }
        this.newProd = result[0].lastPaid;
        this.invCount = result[0].inventory;
        this.lastQuote = result[0].lastQuote
        
        if(this.newProd != null){

            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    Id: '',
                    PricebookEntryId: this.pbeId,
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Ship_Weight__c: this.unitWeight,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.fPrice: this.levelTwo,
                    floorPrice: this.fPrice,
                    lOne: this.agency? this.fPrice : this.levelOne,
                    lTwo: this.levelTwo, 
                    CPQ_Margin__c: this.agency?'':this.levelTwoMargin,
                    Cost__c: this.unitCost,
                    displayCost: this.agency ? 'Agency' : this.unitCost,
                    lastPaid: !this.newProd ? 0 : this.newProd.Unit_Price__c,
                    lastMarg: this.agency ? '' : (this.newProd.Margin__c / 100),
                    docDate: this.newProd.Doc_Date__c,
                    TotalPrice: this.agency? this.fPrice : this.levelTwo,
                    Discount: this.lineDiscount ? this.lineDiscount : '',
                    wInv:  !this.invCount ? 0 :this.invCount.Quantity_Available__c,
                    showLastPaid: true,
                    lastQuoteAmount: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Price__c,
                    lastQuoteMargin: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Margin__c,
                    lastQuoteDate: !this.lastQuote ? '' : this.lastQuote.Quote_Date__c,
                    flrText: 'flr price $'+ this.fPrice,
                    lOneText: 'lev 1 $'+this.levelOne,
                    companyLastPaid: this.companyLastPaid,
                    palletConfig: this.palletConfig,
                    sgn: this.sgn, 
                    //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid: $' +this.companyLastPaid + ' Code ' +this.productCode,
                    goodPrice: true,
                    resUse: this.resUse,
                    manLine: this.productCode.includes('MANUAL CHARGE') ? true : false,
                    Line_Order__c: this.lineOrderNumber,
                    url:`https://advancedturf.lightning.force.com/lightning/r/${this.productId}/related/ProductItems/view`,
                    //prodURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Product2/${this.productId}/view`,
                    prodURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${this.productId}/view`,
                    OpportunityId: this.recordId
                }
            ]
            
        }else{
            this.selection = [
                ...this.selection, {
                    sObjectType: 'OpportunityLineItem',
                    PricebookEntryId: this.pbeId,
                    Id: '',
                    Product2Id: this.productId,
                    agency: this.agency,
                    name: this.productName,
                    ProductCode: this.productCode,
                    Ship_Weight__c: this.unitWeight,
                    Quantity: 1,
                    UnitPrice: this.agency ? this.fPrice: this.levelTwo,
                    floorPrice: this.fPrice,
                    lOne: this.agency? this.fPrice : this.levelOne,
                    lTwo: this.levelTwo,
                    lastPaid: 0,
                    lastMarg: 0, 
                    docDate: 'First Purchase', 
                    CPQ_Margin__c: this.agency?'':this.levelTwoMargin,
                    Cost__c: this.unitCost,
                    displayCost: this.agency ? 'Agency' : this.unitCost,
                    TotalPrice: this.agency? this.fPrice : this.levelTwo,
                    Discount: this.lineDiscount ? this.lineDiscount : '',
                    wInv: !this.invCount ? 0 :this.invCount.Quantity_Available__c,
                    showLastPaid: true,
                    lastQuoteAmount: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Price__c,
                    lastQuoteMargin: !this.lastQuote ? 0 : this.lastQuote.Last_Quote_Margin__c,
                    lastQuoteDate: !this.lastQuote ? '' : this.lastQuote.Quote_Date__c,
                    flrText: 'flr price $'+ this.fPrice,
                    lOneText: 'lev 1 $'+this.levelOne, 
                    companyLastPaid: this.companyLastPaid,
                    palletConfig: this.palletConfig,
                    sgn: this.sgn,
                    //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid $' +this.companyLastPaid + ' Code ' +this.productCode,
                    goodPrice: true,
                    resUse: this.resUse,
                    manLine: this.productCode.includes('MANUAL CHARGE') ? true : false,
                    Line_Order__c: this.lineOrderNumber,
                    url:`https://advancedturf.lightning.force.com/lightning/r/${this.productId}/related/ProductItems/view`,
                    //prodURL: `https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Product2/${this.productId}/view`,
                    prodURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/${this.productId}/view`,
                    OpportunityId: this.recordId
                }
            ]
        }    
            //console.log(JSON.stringify(this.selection));
            let totals =  getTotals(this.selection);
            this.tPrice = roundNum(totals.TotalPrice, 2);
            this.tQty = totals.Quantity;
            this.tCost = getCost(this.selection) 
            if(!this.agency){
                let margin = setMargin(this.tCost, this.tPrice)
                this.tMargin = roundNum(margin, 2);
            }
            this.lineOrderNumber ++;
            this.unsavedProducts = true; 
            this.startEventListener()
        }catch(error){
            alert(error);
       }
    }
//need to add 2 shipping line items
//need to see if the array already has objects. 
//Make Sure ID's are correct
    addShips(){
        const atsShip = {
            sObjectType: 'OpportunityLineItem',
            Id: '',
            PricebookEntryId: '01u2M00000ZBLn5QAH',
            Product2Id: '01t2M0000062XwhQAE',
            //Sandbox
            // PricebookEntryId: '01u2M00000ZBLn5QAH',
            // Product2Id: '01t2M0000062XwhQAE',
            agency: false,
            name: 'ATS SHIPPING',
            ProductCode: 'ATS SHIPPING',
            Ship_Weight__c: 0,
            Quantity: 1,
            UnitPrice: 1.00,
            floorPrice: 0.00,
            lOne: 0.00,
            lTwo: 0.00, 
            CPQ_Margin__c: 0.00,
            Cost__c: 0.00,
            displayCost: 0.00,
            lastPaid: 'use report',
            lastMarg: 'use report',
            docDate: '',
            TotalPrice: 1.00,
            wInv:  0.00,
            showLastPaid: true,
            lastQuoteAmount: 0.00,
            lastQuoteMargin: 0.00,
            lastQuoteDate: 0.00,
            flrText: 'flr price $',
            lOneText: 'lev 1 $',
            companyLastPaid: 0.00,
            palletConfig: 0.00,
            //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid: $' +this.companyLastPaid + ' Code ' +this.productCode,
            goodPrice: true,
            resUse: false,
            manLine: false,
            Line_Order__c: this.lineOrderNumber,
            url:`https://advancedturf.lightning.force.com/lightning/r/01t2M0000062XwhQAE/related/ProductItems/view`,
            prodURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/01t2M0000062XwhQAE/view`,
            OpportunityId: this.recordId
        }
        this.lineOrderNumber ++;
        const atsShipNT = {
            sObjectType: 'OpportunityLineItem',
            Id: '',
            PricebookEntryId: '01u6T00000H6GNQQA3',
            Product2Id: '01t6T000006OzAyQAK',
            //Sandbox
            // PricebookEntryId: '01u7500000BY6SaAAL',
            // Product2Id: '01t75000000rTHPAA2',
            agency: false,
            name: 'ATS SHIPPING - SPLIT SHIPMENTS',
            ProductCode: 'ATS SHIPPING-SPLIT',
            Ship_Weight__c: 0,
            Quantity: 1,
            UnitPrice: 1.00,
            floorPrice: 0.00,
            lOne: 0.00,
            lTwo: 0.00, 
            CPQ_Margin__c: 0.00,
            Cost__c: 0.00,
            displayCost: 0.00,
            lastPaid: 'use report',
            lastMarg: 'use report',
            docDate: '',
            TotalPrice: 1.00,
            wInv:  0.00,
            showLastPaid: true,
            lastQuoteAmount: 0.00,
            lastQuoteMargin: 0.00,
            lastQuoteDate: 0.00,
            flrText: 'flr price $',
            lOneText: 'lev 1 $',
            companyLastPaid: 0.00,
            palletConfig: 0.00,
            //tips: this.agency ? 'Agency' : 'Cost: $'+this.unitCost +' Company Last Paid: $' +this.companyLastPaid + ' Code ' +this.productCode,
            goodPrice: true,
            resUse: false,
            manLine: false,
            Line_Order__c: this.lineOrderNumber,
            url:`https://advancedturf.lightning.force.com/lightning/r/01t2M0000062XwhQAE/related/ProductItems/view`,
            prodURL: `https://advancedturf.lightning.force.com/lightning/r/Product2/01t6T000006OzAyQAK/view`,
            OpportunityId: this.recordId
        }
        const checkShip = this.selection.findIndex(x => x.Product2Id === '01t2M0000062XwhQAE')
        const checkNT = this.selection.findIndex(x => x.Product2Id === '01t6T000006OzAyQAK')
        console.log(1, checkShip, 2, checkNT)
        if(checkShip >= 0 && checkNT >=0 ){
            return; 
        }else if(checkShip < 0 && checkNT < 0){
            this.selection = [...this.selection, atsShip, atsShipNT]; 
            this.lineOrderNumber ++
        }else if(checkShip < 0 && checkNT >=0){
            this.selection = [...this.selection, atsShip ];
            this.lineOrderNumber --;
        }else if(checkShip >= 0 && checkNT < 0){
            this.selection = [...this.selection, atsShipNT ];
            this.lineOrderNumber --;
        }else{
            return; 
        }
        
        this.unsavedProducts = true; 
        this.startEventListener()
        
    }

    addManualLine(){
        this.numbOfManLine ++;
        if(this.numbOfManLine<10){ 

        this.selection = [
            ...this.selection, {
                sObjectType: 'OpportunityLineItem',
                //have to get hard coded id
                PricebookEntryId: '01u75000004xmuzAAA',
                Id: '',
                Product2Id: '01t75000000bV2aAAE',
                agency: false,
                name: 'Manual Line.'+this.numbOfManLine,
                ProductCode: 'Manual Line.'+this.numbOfManLine,
                Ship_Weight__c: 0,
                Quantity: 1,
                UnitPrice: 0,
                floorPrice: 0,
                lOne: 0,
                lTwo: 0,
                lastPaid: 0,
                lastMarg: 0, 
                docDate: 'First Purchase', 
                CPQ_Margin__c: 0,
                Cost__c: 1,
                TotalPrice: 0,
                wInv: 0,
                showLastPaid: true,
                flrText: 'flr price $',
                lOneText: 'lev 1 $', 
                tips: 'manual line',
                goodPrice: true,
                resUse: 'false',
                manLine: true,
                OpportunityId: this.recordId
            }
        ]
        this.unsavedProducts = true; 
        }else{
            alert('can only have 9 man lines')
        }
        console.log(this.selection)
    }

    //If a user decides to uncheck a product on the search screen
    handleRemove(y){
        
        let index = this.selection.findIndex(prod => prod.PricebookEntryId === y.detail);
        
        if(index > -1){
            this.selection.splice(index, 1);
            this.lineOrderNumber --; 
        }else{
            return; 
        }   
    }

    //Handle Pricing change here
    newPrice(e){
        window.clearTimeout(this.delay);
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        //let targetId = this.selection.find(ele => ele.ProductCode === e.target.name);
        let targetId = e.target.name; 
        
        
        this.delay = setTimeout(()=>{
            this.selection[index].UnitPrice = e.detail.value;
            this.selection[index].UnitPrice = Number(this.selection[index].UnitPrice);
            
            if(this.selection[index].UnitPrice > 0){
                this.selection[index].CPQ_Margin__c = Number((1 - (this.selection[index].Cost__c /this.selection[index].UnitPrice))*100).toFixed(2)
                this.selection[index].TotalPrice = (this.selection[index].Quantity * this.selection[index].UnitPrice).toFixed(2);    

            }
            //Alert the user if the pricing is good. If an item is below floor don't allow a save. Could push that item to special order
            let lOne = Number(this.selection[index].lOne);
            let floor = Number(this.selection[index].floorPrice);
            let unitp = Number(this.selection[index].UnitPrice);
            this.handleWarning(targetId,lOne, floor, unitp, index)
            let totals =  getTotals(this.selection);
            this.tPrice = roundNum(totals.TotalPrice, 2);
            if(!this.selection[index].agency){
                let margin = setMargin(this.tCost, this.tPrice)
                this.tMargin = roundNum(margin, 2);
            }

        }, 1000)
        this.unsavedProducts = true;
        this.startEventListener(); 
    }
    

    newMargin(m){
        window.clearTimeout(this.delay)
        let index = this.selection.findIndex(prod => prod.ProductCode === m.target.name)
        let targetId = m.target.name; 
        
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delay = setTimeout(()=>{
                this.selection[index].CPQ_Margin__c = Number(m.detail.value);
                
                if(1- this.selection[index].CPQ_Margin__c/100 > 0){
                    this.selection[index].UnitPrice = Number(this.selection[index].Cost__c /(1- this.selection[index].CPQ_Margin__c/100)).toFixed(2);
                    
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)
                    this.selection[index].TotalPrice = lineTotal(this.selection[index].Quantity, this.selection[index].UnitPrice);                
                }else{
                    this.selection[index].UnitPrice = 0;
                    this.selection[index].UnitPrice = this.selection[index].UnitPrice.toFixed(2);
                    this.selection[index].TotalPrice = Number(this.selection[index].Units_Required__c * this.selection[index].UnitPrice).toFixed(2)   
                 
                }
                //Alert the user if the pricing is good. If an item is below floor don't allow a save. Could push that item to special order
            let lOne = Number(this.selection[index].lOne);
            let floor = Number(this.selection[index].floorPrice);
            let unitp =  Number(this.selection[index].UnitPrice);
            this.handleWarning(targetId,lOne, floor, unitp, index);
            //update order totals
            let totals =  getTotals(this.selection);
            this.tPrice = roundNum(totals.TotalPrice, 2)
            if(!this.selection[index].agency){
                let margin = setMargin(this.tCost, this.tPrice)
                this.tMargin = roundNum(margin, 2);
            }
    },1000)
    this.unsavedProducts = true;
    this.startEventListener(); 
    }
    
    newQTY(e){
        // if(e.detail.value % 1 != 0){
        //     this.goodQty = false; 
        //     return
        // }
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.name)
        
        this.selection[index].Quantity = Number(e.detail.value);
 //need to figure out how not run on zeroed out qty. 
        if(this.selection[index].UnitPrice >0 && this.selection[index].Quantity > 0){
            this.selection[index].TotalPrice = roundNum(this.selection[index].Quantity * this.selection[index].UnitPrice, 2) 
            this.goodQty = true;   
        }
        let totals =  getTotals(this.selection);
//handle warning lights if qty is higher than avaliable
        let want = Number(this.selection[index].Quantity);
        let aval = Number(this.selection[index].wInv)
        this.qtyWarning(e.target.name, want,aval)

//round total price and qty set margin
        this.tPrice = roundNum(totals.TotalPrice, 2)
        //this.shpWeight = totals.Ship_Weight__c;
        this.tQty = totals.Quantity;
        this.tCost = getCost(this.selection)
        this.unsavedProducts = true;
        this.startEventListener();
        this.unsavedProducts = true;
        if(!this.selection[index].agency){
            let margin = setMargin(this.tCost, this.tPrice)
            this.tMargin = roundNum(margin, 2);
        }

    }
    newComment(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name);
        this.selection[index].Description = x.detail.value; 
        this.unsavedProducts = true;   
        this.startEventListener();  
    }

    updateLineNumb(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name);
        this.selection[index].Line_Order__c = x.detail.value; 
        this.unsavedProducts = true;   
        this.startEventListener(); 
    }

    //save line items updated order on removal of old line items. 
    saveLineItems(arr){
        const recordInputs = arr.slice().map(draft =>{
            let Id = draft.Id; 
            let Line_Order__c = draft.Line_Order__c;
            const fields = {Id, Line_Order__c}

        return {fields};
        })
        
        const promises = recordInputs.map(input => updateRecord(input)); 
        Promise.all(promises).then(prod => {
            return; 
        }).catch(error => {
            console.log(error);
            
            // Handle error
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Margin Error',
                    message: error.body.output.errors[0].message,
                    variant: 'error'
                })
            )
        })
    }


    removeProd(x){
        let index = this.selection.findIndex(prod => prod.ProductCode === x.target.name)
        let id = this.selection[index].Id; 
        let shipCode = this.selection[index].ProductCode;
        let resUseProd = this.selection[index].resUse;
        
        if(index >= 0){
            let cf = confirm('Do you want to remove this entry?')
            if(cf ===true){
                this.selection = removeLineItem(index, this.selection); 
                this.selection.splice(index, 1);
                if(id && !shipCode.includes('SHIPPING') && !resUseProd){
                    
                    deleteRecord(id);
        //check if the deleted line item is shipping. If so reset shipping to zero 
                }else if(id && shipCode.includes('SHIPPING')){
                    deleteRecord(id);
                    
                    
                    const fields = {};
                    fields[ID_FIELD.fieldApiName] = this.recordId;
                    fields[SHIPCHARGE.fieldApiName] = 0;
                    const shipRec = {fields}
                    updateRecord(shipRec);
        //check if it's a RUP product. Then check if there are another RUP product on order. If no then update the opportunity field RUP Selected ? to false
                }else if(id && resUseProd){
                    deleteRecord(id);
                    let rupProds = checkRUP(this.selection);
                    if(!rupProds && this.rupSelected){
                        const fields = {};
                        fields[ID_FIELD.fieldApiName] = this.recordId;
                        fields[RUP_PROD.fieldApiName] = rupProds;
                        const resUseSelected = {fields}
                        updateRecord(resUseSelected);  
                    }
                }
                //save the product numbers for ordering products in line
                this.saveLineItems(this.selection);

                //for ordering the products on the screen
                this.lineOrderNumber = isNaN((this.selection.at(-1).Line_Order__c + 1)) ? (this.selection.length + 1) : (this.selection.at(-1).Line_Order__c + 1);
                //update order totals
                let totals =  getTotals(this.selection);
            
                this.tPrice = totals.TotalPrice;
                //this.shpWeight = totals.Ship_Weight__c;
                this.tQty = totals.Quantity;
                this.tCost = getCost(this.selection);  
                let margin = setMargin(this.tCost, this.tPrice)
                this.tMargin = roundNum(margin, 2);
                //check pricing
                this.goodPricing = checkPricing(this.selection);
            }
        }      
    }

    //allow reps to sort line items
     sortBtnText = 'Sort Items'
     showSort = false; 
    handleSort(){
       this.sortBtnText = this.sortBtnText === 'Sort Items'? 'Hide Sort': 'Sort Items'; 
       this.showSort = this.showSort === true ? false: true;       
    }

//Sort the line items up and down if you dont want to enter number
    moveUp(event){
        
        let index = this.selection.findIndex(prod => prod.ProductCode === event.target.name)
        if(index>0){
            this.template.querySelector(`[data-box="${event.target.name}"]`).classList.add('moveBoxUp');
            let name = event.target.name; 
            let moveEl = index -1; 
         
            this.selection[index].Line_Order__c --;
            this.selection[moveEl].Line_Order__c ++;
            let lineUp = sortArray(this.selection)
            this.selection = [...lineUp]; 
            this.unsavedProducts = true;   
            this.startEventListener(); 
            setTimeout(()=>{
                this.template.querySelector(`[data-box="${name}"]`).classList.remove('moveBoxUp');
            },500);
           
        }
    }
    moveDown(event){
        
        let index = this.selection.findIndex(x => x.ProductCode === event.target.name);
        let name = event.target.name;
        if(index<(this.selection.length-1)){
            this.template.querySelector(`[data-box="${event.target.name}"]`).classList.add('moveBoxDown');
            let moveEl = index + 1; 
            this.selection[index].Line_Order__c ++;
            this.selection[moveEl].Line_Order__c --;
            let lineUp = sortArray(this.selection)
            this.selection = [...lineUp];
            this.unsavedProducts = true;   
            this.startEventListener();
            setTimeout(()=>{
                this.template.querySelector(`[data-box="${name}"]`).classList.remove('moveBoxDown');
            },500);
        }
    }
    //get warehouse options
//these are hardcoded to full NEED TO GET DYNAMIC

    // get warehouseOptions(){
    //     return [
    //         {label:'All', value:'All'},
    //         {label: '105 | Noblesville', value:'1312M000000PB0ZQAW'}, 
    //         {label:'115 | ATS Ingalls', value:'1312M00000001nsQAA'},
    //         {label:'125 | ATS Lebanon (Parts)', value:'1312M00000001ntQAA'},
    //         {label:'200 | ATS Louisville', value:'1312M00000001nuQAA'},
    //         {label:'250 | ATS Florence', value:'1312M00000001nvQAA'},
    //         {label:'270 | ATS Winston-Salem', value:'1312M00000001nwQAA'},
    //         {label:'310 | ATS Tomball', value:'1312M000000PB6AQAW'},
    //         {label:'360 | ATS Nashville', value:'1312M00000001nxQAA'},
    //         {label:'400 | ATS Columbus', value:'1312M00000001nyQAA'},
    //         {label:'415 | ATS Sharonville', value:'1312M00000001nzQAA'},
    //         {label:'440 | ATS Lewis Center', value:'1312M00000001o0QAA'},
    //         {label:'450 | ATS Brecksville', value:'1312M00000001o1QAA'},
    //         {label:'470 | ATS Boardman', value:'1312M00000001o2QAA'},
    //         {label:'510 | ATS Travis City', value:'1312M00000001o3QAA'},
    //         {label:'520 | ATS Farmington Hills', value:'1312M00000001o4QAA'},
    //         {label:'600 | ATS - Elkhart', value:'1312M00000001o5QAA'},
    //         {label:'710 | ATS - St. Peters', value:'1312M00000001o6QAA'},
    //         {label:'720 | ATS - Cape Girardeau', value:'1312M00000001o7QAA'},
    //         {label:'730 | ATS - Columbia', value:'1312M00000001o8QAA'},
    //         {label:'770 | ATS - Riverside', value:'1312M00000001o9QAA'},
    //         {label:'790 | ATS - Springfield', value:'1312M0000004D7IQAU'},
    //         {label:'820 | ATS - Wheeling', value:'1312M000000PB0UQAW'},
    //         {label:'850 | ATS - Madison', value:'1312M00000001oAQAQ'},
    //         {label:'860 | ATS - East Peoria', value:'1312M000000PB2BQAW'},
    //         {label:'960 | ATS - Monroeville', value:'1312M00000001oBQAQ'},
    //         {label:'980 | ATS - Ashland', value:'1312M00000001oCQAQ'},
    //         {label:'999 | ATS - Fishers', value:'1312M000000PB3FQAW'}

    //     ];
    // }

    //check other inventory
    async checkInventory(locId){
        this.warehouse = locId.detail.value; 
        this.loaded = false;
        let data = [...this.selection];
        let pcSet = new Set();
        let prodCodes = [];
        try{
            data.forEach(x=>{
                pcSet.add(x.ProductCode);
            })
            prodCodes = [...pcSet];

            let inCheck = await inCounts({pc:prodCodes, locId:this.warehouse});
            //console.log('inCheck ' +JSON.stringify(inCheck));
            this.selection = this.warehouse === 'All' ? await allInventory(data, inCheck) : await newInventory(data, inCheck);
            //this will cause rerender to run so we can update the warning colors. 
            this.hasRendered = true; 
            //console.log(JSON.stringify(this.selection)); 
        }catch(error){
            this.error = error;
            const evt = new ShowToastEvent({
                title: 'Error loading inventory',
                message: this.error,
                variant: 'warning'
            });
            this.dispatchEvent(evt);
        }finally{
            this.loaded = true;
        }    
    }

    // Save Products Only Not Submit
    saveProducts(){
        this.loaded = false; 
        
        const newProduct = this.selection.filter(x=>x.Id === '') 

        const alreadyThere = this.selection.filter(y=>y.Id != '')
        let shipTotal = this.selection.filter(y => y.ProductCode.includes('SHIPPING'));
        //check if there are Restricted Use Products on the order list
        let rupProds = checkRUP(this.selection);
        console.log('sending '+JSON.stringify(this.selection))
        
        //createProducts({newProds: newProduct, upProduct: alreadyThere, oppId: this.recordId})
        createProducts({olList: this.selection, oppId: this.recordId, accId: this.accountId})
        .then(result=>{
            //need to map over return values and save add in non opp line item info 
            let back = updateNewProducts(newProduct, result);
            
            this.selection =[...alreadyThere, ...back];
            //sort based on line item for pdf
            this.selection = sortArray(this.selection)
            //console.log(JSON.stringify(this.selection));
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Products Saved',
                    variant: 'success',
                }),
            );
            //this is throwing errors on save. Not letting the remove
            getRecordNotifyChange([{recordId: this.recordId}])
        }).then(()=>{
            let shipCharge = getShipping(shipTotal);
            if(shipCharge >0 && !rupProds){
            
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[SHIPCHARGE.fieldApiName] = shipCharge;
                const shipRec = {fields}
                updateRecord(shipRec)
            }else if(shipCharge <= 0 && rupProds){
                
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[RUP_PROD.fieldApiName] = rupProds;
                const recUpdate = {fields}
                updateRecord(recUpdate);
            }else if(shipCharge >0 && rupProds){
    
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[RUP_PROD.fieldApiName] = rupProds;
                fields[SHIPCHARGE.fieldApiName] = shipCharge;
                const bothUpdate = {fields}
                updateRecord(bothUpdate);
            }
         
        }).catch(error=>{
            this.endEventListener(); 
            let mess = JSON.stringify(error);
            console.log(JSON.stringify(error));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Saving Products',
                    message:mess,
                    variant: 'error',
                }),
            );
        }).finally(()=>{
            this.unsavedProducts = false; 
            this.loaded = true; 
            this.endEventListener(); 
        })
    }

    moveStage(){
        this.loaded = false;
        createProducts({olList: this.selection})
        .then(result=>{
            if(this.shippingAddress != null || !this.shippingAddress){
                
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[SHIPADD.fieldApiName] = this.shippingAddress;
                fields[STAGE.fieldApiName] = 'Quote(45%)';
                const shipRec = {fields}
                updateRecord(shipRec)
            }else{
                const fields = {}
                fields[ID_FIELD.fieldApiName] = this.recordId;
                fields[STAGE.fieldApiName] = 'Quote(45%)';
                const opp = {fields};
                updateRecord(opp)  
            } 
        }) 
        .then(()=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Quote Updated',
                    variant: 'success'
                })
            );
            // Display fresh data in the form
            getRecordNotifyChange({recordId: this.recordId})
            this.unsavedProducts = false; 
            this.loaded = true; 
        }).catch(error=>{
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title:'Error Updating Record',
                    message: error.body.message,
                    variant: 'error'
                })
            )
        })
        //Needed Winter 23
        // LightningAlert.open({
        //     message: 'not connected to anything. This is a new lwc alert!',
        //     //label defaults to "Alert"
        //     variant: 'headerless',
        // }).then((result) => {
        //     console.log('alert result', result);
        // });
    }

    saveSubmit(){
        this.loaded = false; 
        let valid = this.isValid();
        if(valid === 'no ship'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Shipping Address',
                    message: 'Please select a shipping address!',
                    variant: 'error',
                }),
            );
            this.loaded = true; 
            return; 
        }else if(valid === 'no delivery'){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Delivery Date',
                    message: 'Please select on delivery date!',
                    variant: 'error',
                }),
            );
            this.loaded = true; 
            return; 
        }
        
        console.log('sending '+JSON.stringify(this.selection))
        createProducts({olList: this.selection})
        .then(result=>{
            const fields = {};
            fields[STAGE.fieldApiName] = 'Closed Won';
            fields[ID_FIELD.fieldApiName] = this.recordId;
            fields[SHIPADD.fieldApiName] = this.shippingAddress;
            //console.log('sa ' +JSON.stringify(fields));
            
            const recordInput = { fields };

            updateRecord(recordInput).then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Opportunity Submitted',
                        variant: 'success'
                    })
                );
                // Display fresh data in the form
               // return refreshApex(this.contact);
            })
            this.unsavedProducts = false; 
        }).catch(error=>{
            console.log(JSON.stringify(error))
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Saving Products',
                    message,
                    variant: 'error',
                }),
            );
        }).finally(()=>{
            this.loaded = true; 
        })
    }
    isValid(){
        let res = 'good';
        if(this.shippingAddress ===null || !this.shippingAddress){
            res = 'no ship';
         }else if(this.deliveryDate == null || !this.deliveryDate){
             res = 'no delivery'
        }
        return res; 
    }
    //on load get products
    //get last paid next
    async loadProducts(){
        //inventory vars
        let inSet = new Set();
        let prodIdInv = []; 
        let inCode = new Set();
        let codes = [];
        try{
            let results = await getProducts({oppId: this.recordId})
            
            if(results.length === 0){                
                return; 
            }else if(results){

                results.forEach(item =>{
                    inSet.add(item.Product2Id);
                    inCode.add(item.Product2.ProductCode)
                });
                prodIdInv = [...inSet];
                
                codes = [...inCode]; 
            }
            //console.log('results '+JSON.stringify(results));
            
            let invenCheck = await onLoadGetInventory({locId: this.warehouse, pIds: prodIdInv});
            //console.log('invCheck '+JSON.stringify(invenCheck));
            
            //get last paid and last quote then merge together
            let lastPaid = await onLoadGetLastPaid({accountId: this.accountId, productCodes:codes})
            let lastQuote = await onLoadGetLastQuoted({accountId: this.accountId, productCodes: codes, opportunityId: this.recordId});

            let priceLevels = await onLoadGetLevels({priceBookId: this.pbId, productIds:prodIdInv})
            
            //MERGE the inventory and saved products. 
            let mergedInven = await mergeInv(results,invenCheck);
            if(lastQuote.length>0){
                //console.log('running mergeLastQuote');
                mergedInven = await mergeLastQuote(mergedInven, lastQuote);
            }
            //merge last paid saved products
            let mergedLastPaid = await mergeLastPaid(mergedInven,lastPaid);            
            //MERGE the price levels and saved products
            let mergedLevels = await mergeInv(mergedLastPaid, priceLevels);
            
            
            //IF THERE IS A PROBLEM NEED TO HANDLE THAT STILL!!!
            this.selection = await onLoadProducts(mergedLevels, this.recordId); 
            
            //get for ordering
            this.lineOrderNumber = isNaN((this.selection.at(-1).Line_Order__c + 1)) ? (this.selection.length + 1) : (this.selection.at(-1).Line_Order__c + 1);
            
            
            //get the order totals; 
            let totals = await getTotals(this.selection);
            //set the number of manual lines on the order
            this.numbOfManLine = await getManLines(this.selection);
            this.tPrice = roundNum(totals.TotalPrice,2);
            //this.shpWeight = totals.Ship_Weight__c;
            this.tQty = totals.Quantity;
            this.tCost = await getCost(this.selection);  
            
            let margin = setMargin(this.tCost, this.tPrice)
            this.tMargin = roundNum(margin, 2);
            
         }catch(error){
            let mess = error; 
            console.error('error ==> '+error);
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading products',
                    message: mess,
                    variant: 'error',
                }),
            );
            
        }finally{
            this.prodFound = true; 
            this.loaded = true;
        }

    }
///Warning Section. Checking if the price is too low or there is enough qty
    qtyWarning = (target, qty, aval)=>{
     ///console.log(1,target,2,qty,3,aval);
        
        let targ = this.template.querySelector(`[data-tar="${target}"]`)
        if(qty>aval){
            //targ.classList.toggle('color'); 
           this.template.querySelector(`[data-tar="${target}"]`).style.color = 'orange'; 
        }else if(qty<aval){
            this.template.querySelector(`[data-tar="${target}"]`).style.color = 'black';
            //targ.classList.toggle('color');
        }
        
    }
    //handles alerting the user if the pricing is good or bad 
    //the countOfBadPrice prevents if multiple products are too low if one product is fixed it wont allow save. 
    handleWarning = (targ, lev, flr, price, ind)=>{
        console.log(1,lev, 2, flr, 3, price);
        
        if(price > lev){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
            this.selection[ind].goodPrice = true; 
            this.goodPricing = checkPricing(this.selection);
           
        }else if(price<lev && price>=flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="orange";
            this.selection[ind].goodPrice = true;
            this.goodPricing = checkPricing(this.selection);
            
        }else if(price===lev && price>=flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
            this.selection[ind].goodPrice = true;
            this.goodPricing = checkPricing(this.selection);
            
        }else if(price<flr){
            this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
            this.template.querySelector(`[data-margin="${targ}"]`).style.color ="red";
            this.selection[ind].goodPrice = false;
            this.goodPricing = checkPricing(this.selection);
             
        }
    }
    //init will check pricing and render the color 
    //should only run on load. Then handleWarning function above runs because it only runs over the individual line
    //Important don't query UnitPrice on Opp Line Item. Otherwise it will think the cost is the same price. 
    initPriceCheck(){
        this.hasRendered = false; 
        console.log('init');
        
            for(let i=0; i<this.selection.length; i++){
                //console.log(this.selection[i])
                let target = this.selection[i].ProductCode
                let level = Number(this.selection[i].lOne);
                let floor = Number(this.selection[i].floorPrice);
                let price = Number(this.selection[i].UnitPrice);
                
                if(price>level){
                    //console.log('good to go '+this.selection[i].name);
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                    this.template.querySelector(`[data-margin="${target}"]`).style.color ="black";
                }else if(price<level && price>=floor){
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="orange";
                    this.template.querySelector(`[data-margin="${target}"]`).style.color ="orange";
                }else if(price === level && price>=floor){
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="black";
                    this.template.querySelector(`[data-margin="${target}"]`).style.color ="black";
                }else if(price<floor){
                    this.template.querySelector(`[data-id="${target}"]`).style.color ="red";
                    this.template.querySelector(`[data-margin="${target}"]`).style.color ="red" 
                    this.goodPricing = false;
                }
            }
            //call inventory check
        this.initQtyCheck();    
    }
    initQtyCheck(){
        for(let i=0; i<this.selection.length; i++){
            let target = this.selection[i].ProductCode
            let qty = Number(this.selection[i].Quantity);
            let aval = Number(this.selection[i].wInv);
            if(qty>aval){
                this.template.querySelector(`[data-tar="${target}"]`).style.color = 'orange'; 
             }
        }
    }
    //Show floor vs last paid
    showValues(e){
        let index = this.selection.findIndex(prod => prod.ProductCode === e.target.dataset.targetId);
        
        if(this.selection[index].showLastPaid){ 
            this.selection[index].showLastPaid = false;
        }else{
            this.selection[index].showLastPaid = true; 
        }
    }
    hideMarge(){
        console.log('click ' +this.pryingEyes);
        
        this.pryingEyes = this.pryingEyes ? false : true; 
    }
    //open price book search
    openProdSearch(){
        this.template.querySelector('c-prod-search').openPriceScreen(); 
    }

    // congaTest(){
    //    // https://advancedturf--c.vf.force.com/services/Soap/u/37.0/00D41000002Fly1
    //     let url ="https://advancedturf.lightning.force.com/apex/APXTConga4__Conga_Composer?ServerURL=/Soap/u/37.0/00D41000002Fly1&solmgr=1" +
    //     "&id=0014100001vPUVrAAO" +
    //     "&templateid=a2O2M000009948kUAA" +
    //     "&ac0=1" +
    //     "&ac1=EOP Storage Agreement Sent via CongaSign" +
    //     "&csvisible=1" +
    //     "&csroutingtype=PARALLEL" +
    //     "&uf0=1" +
    //     "&mfts0=EOP_Storage_Agreement__c" +  
    //     "&mftsvalue0=True" +
    //     "&ds7=1142" +
    //     "&csrecipient1=0034100002QhPfEAAV" +
    //     "&csrecipient2=00541000006o7BzAAI"  +
    //     "&csrole2=cc" +
    //     "&ReturnPath=0014100001vPUVrAAO";
    //     let target = '_self'; 
    //     let features = ''
    //     window.open( url, target, features );
    // }
}