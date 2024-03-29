import { LightningElement,track,api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import checkPrice from '@salesforce/apex/quickPriceSearch.getPricing';
import inCounts from '@salesforce/apex/cpqApex.inCounts';
import {newInventory,allInventory} from 'c/helper' 
export default class QuickPriceCheck extends LightningElement {
    @api flexipageRegionWidth;
    formSize; 
    searchTerm;
    priceBook = '01s410000077vSKAAY';
    loaded; 
    showInventory = false; 
    warehouse; 
    btnLabel = 'Check Inventory';
    @track prod = [];
    
    connectedCallback(){ 
        this.formSize = this.screenSize(FORM_FACTOR);
        this.loaded = true; 
        
    }

    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }
    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.searchTerm = evt.target.value;
            this.search(); 
        }
    }

    callSearch(){ 
        this.searchTerm = this.template.querySelector('lightning-input').value
        this.search();
    }

    search(){
        if(this.searchTerm.length < 3){
            alert('search must be at least 3 letters');
            return; 
        }
        this.loaded = false
        checkPrice({priceBookId: this.priceBook, searchKey: this.searchTerm})
        .then((res)=>{ 
           //console.log(JSON.stringify(res))
                let name;
                let cost; 
                let flr;
                let lev1;
                let lev2;
                let stock;
                let allStock;
                let ProductCode;  
                let url; 
                this.prod = res.map(x=>{
                    name= x.Product2.Name + ' - '+ x.Product2.ProductCode,
                    cost = x.Agency_Product__c ? 'Agency' : x.Product_Cost__c,
                    flr = x.Floor_Price__c,
                    lev1 = x.Level_1_UserView__c,
                    lev2 = x.Level_2_UserView__c,
                    stock = x.Product2.Product_Status__c,
                    allStock = x.Product2.Total_Product_Items__c
                    ProductCode = x.Product2.ProductCode,
                    url = 'https://advancedturf.lightning.force.com/lightning/r/'+x.Product2Id+'/related/ProductItems/view'
                    return {...x, name, cost, flr, lev1, lev2, stock, allStock, ProductCode,url}
                })
        }).then(()=>{
            this.loaded = true; 
            this.searchTerm = ''; 
            let x = this.template.querySelector('lightning-input').value;
            x = ''; 
            console.log(JSON.stringify(this.prod));
            
        })
    }

    enableInventory(){
       
        if(this.prod.length<1){
            alert('must have found at least 1 product');
            return; 
        }
        if(!this.showInventory){ 
            this.showInventory = true; 
            this.btnLabel = 'Back to Products';
        }else{ 
            this.showInventory = false;
            this.btnLabel = 'Check Inventory';
        }
    }

    get warehouseOptions(){
        return [
            {label:'All', value:'All'},
            {label: '105 | Noblesville', value:'1312M000000PB0ZQAW'}, 
            {label:'115 | ATS Ingals', value:'1312M00000001nsQAA'},
            {label:'125 | ATS Lebanon (Parts)', value:'1312M00000001ntQAA'},
            {label:'200 | ATS Louisville', value:'1312M00000001nuQAA'},
            {label:'250 | ATS Florence', value:'1312M00000001nvQAA'},
            {label:'270 | ATS Winston-Salem', value:'1312M00000001nwQAA'},
            {label:'310 | ATS Tomball', value:'1312M000000PB6AQAW'},
            {label:'360 | ATS Nashville', value:'1312M00000001nxQAA'},
            {label:'400 | ATS Columbus', value:'1312M00000001nyQAA'},
            {label:'415 | ATS Sharonville', value:'1312M00000001nzQAA'},
            {label:'440 | ATS Lewis Center', value:'1312M00000001o0QAA'},
            {label:'450 | ATS Brecksville', value:'1312M00000001o1QAA'},
            {label:'470 | ATS Boardman', value:'1312M00000001o2QAA'},
            {label:'510 | ATS Travis City', value:'1312M00000001o3QAA'},
            {label:'520 | ATS Farmington Hills', value:'1312M00000001o4QAA'},
            {label:'600 | ATS - Elkhart', value:'1312M00000001o5QAA'},
            {label:'710 | ATS - St. Peters', value:'1312M00000001o6QAA'},
            {label:'720 | ATS - Cape Girardeau', value:'1312M00000001o7QAA'},
            {label:'730 | ATS - Columbia', value:'1312M00000001o8QAA'},
            {label:'770 | ATS - Riverside', value:'1312M00000001o9QAA'},
            {label:'790 | ATS - Springfield', value:'1312M0000004D7IQAU'},
            {label:'820 | ATS - Wheeling', value:'1312M000000PB0UQAW'},
            {label:'850 | ATS - Madison', value:'1312M00000001oAQAQ'},
            {label:'860 | ATS - East Peoria', value:'1312M000000PB2BQAW'},
            {label:'960 | ATS - Monroeville', value:'1312M00000001oBQAQ'},
            {label:'980 | ATS - Ashland', value:'1312M00000001oCQAQ'},
            {label:'999 | ATS - Fishers', value:'1312M000000PB3FQAW'}

        ];
    }

    async checkInventory(locId){
        this.warehouse = locId.detail.value; 
        this.loaded = false;
        let data = [...this.prod];
        let pcSet = new Set();
        let prodCodes = [];
        try{
            data.forEach(x=>{
                pcSet.add(x.ProductCode);
            })
            prodCodes = [...pcSet];

            let inCheck = await inCounts({pc:prodCodes, locId:this.warehouse});
           // console.log('inCheck ' +JSON.stringify(inCheck));
            this.prod = this.warehouse === 'All' ? await allInventory(data, inCheck) : await newInventory(data, inCheck);
            //this will cause rerender to run so we can update the warning colors. 
            //console.log('back')
            console.log(JSON.stringify(this.prod)); 
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
}

