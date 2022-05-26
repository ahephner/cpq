import { LightningElement, api, track } from 'lwc';
import mobileSearchProduct from '@salesforce/apex/cpqApex.mobileSearchProduct';


export default class MobileSearch extends LightningElement {
    queryTerm;
    cat = 'All';  
    pf = 'All';
    priceBookId = '01s410000077vSKAAY'; 
    @track prod =[]; 
    @track items =[]; 
    loaded = false;
    showFam = false; 
    showFilters = false; 
    openFilters = false;
    connectedCallback(){
        this.loaded = true; 
    }
    //handle the search button click
    handleSearch(){
        var input = this.template.querySelector('lightning-input')
        this.queryTerm = input.value.trim().toLowerCase(); 
        console.log(this.queryTerm)
        this.search();  
    }

    addFilters(){
        if(this.items){
            this.items = []
        }
       // this.template.querySelector('c-mobile-search-filters').openFilter();
       this.openFilters = true; 
    }
    closeFilter(){
        this.openFilters = false;
    }

    updateFilters(event){
        this.cat = event.detail.cat;
        let catLab = event.detail.catLab
        this.pf = event.detail.pf;  
        this.handlePills(catLab, this.pf);
    }
    handlePills(cat, pf){
        const catPill = cat !='All' ? {label:cat, name:'catPill'} : 'All';
        const pfPill = pf!= 'All' ? {label:pf, name:'familyPill'} : 'All';
       // console.log('handle pill');
        
    //console.log('pfPill '+JSON.stringify(pfPill)+' catPill '+JSON.stringify(catPill));
        
        if(catPill != 'All' && pfPill !='All'){
            this.items.push(catPill, pfPill);
        }else if(catPill !='All' && pfPill ==='All'){
            this.items.push(catPill);
        }else if(catPill ==='All' && pfPill !='All'){
            this.items.push(pfPill);
        }else{
            this.items = [];
        }
        this.showFilters = true; 
    }
    removePill(pill){
        let type = pill.detail.item.name
        let index = pill.detail.index;
        this.items.splice(index, 1);
        if(type === 'catPill'){
            this.cat = 'All'
        }else{
            this.pf = 'All';
        }        
    }
    search(){
        let test; 
        //console.log('pf '+this.pf+' cat '+this.cat +' searchTerm '+this.queryTerm);
        this.cat = !this.cat ? 'All':this.cat; 
        //console.log(test);
        
        this.loaded = false; 
        mobileSearchProduct({searchKey: this.queryTerm, cat: this.cat, family: this.pf, priceBookId:this.priceBookId})
            .then((results)=>{
                let Name;
                let ProductCode
                let icon;
                let title;
                let agency;
                let onhand; 
                let weight;
                let status;
                let palletConfig;
                let msg;
                this.prod = results.map(x =>{
                    Name = x.Product2.Name,
                    ProductCode = x.Product2.ProductCode,
                    agency = x.Agency_Product__c,
                    onhand = x.Product2.Total_Product_Items__c,
                    icon = x.Product2.Temp_Unavailable__c ? 'action:freeze_user':'action:new',
                    title = '',
                    weight = x.Product2.Ship_Weight__c,
                    status = x.Product2.Product_Status__c,
                    palletConfig = x.Product2.Pallet_Qty__c,
                    msg =  x.Product2.Temp_Mess__c 
                    return {...x, Name, ProductCode, icon, title, agency, onhand, weight, status, palletConfig, msg}
                })
                //console.log(JSON.stringify(this.prod))
              
                
            }).catch((error)=>{
                this.error = error;
                console.log('error -->'+JSON.stringify(error));
            }).finally(()=>{
                    this.loaded = true; 
                    
            })
    }
    //helper function finds selected product and changes button. 
    findProduct(sel){
        let index = this.prod.findIndex(item => item.Id === sel.target.name)
        
        if(this.prod[index].icon === 'action:freeze_user'){
            alert('Temp unavaliable reason: ' + this.prod[index].msg)
        }else if(this.prod[index].icon==='action:new'){
            this.prod[index].icon = 'action:approval'
            this.prod[index].title = 'added!'
            this.addProduct(this.prod[index]);
        }else{
            this.prod[index].icon = 'action:new'
            this.prod[index].title = ''
            this.removeProduct(this.prod[index])
        }
        return ;
        
    }
    addProduct(product){
        
        const pd = product;
        //console.log(JSON.stringify(pd))
        this.dispatchEvent(new CustomEvent('newprod',{
            detail: pd
        }))
    }

    removeProduct(sProd){
        const removeCode = sProd.ProductCode;

        this.dispatchEvent(new CustomEvent('remove',{
            detail: removeCode
        }))
    }
    @api
    showResult(mess){
        console.log('mess ' +mess); 
    }
    handleDone(){
        this.loaded = false;
        this.dispatchEvent(new CustomEvent('close'));
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}